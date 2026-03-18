import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import type { IntakeData } from '@/lib/types';
import { SONG_GENERATION_SYSTEM_PROMPT } from '@/content/prompts/song-generation';

const log = createRouteLogger('intake');

const MIN_FREEFORM_WORDS = 15;

interface IntakeBody {
  freeformContext: string;
  parsedName?: string;
  preGeneratedLyrics?: string;
  preGeneratedStyle?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<IntakeBody>;
    log.info(ctx.reqId, 'Request received', { name: body.parsedName });

    // ── Validate input ──────────────────────────────────────────────────────
    const freeform = body.freeformContext?.trim() ?? '';
    if (freeform.split(/\s+/).length < MIN_FREEFORM_WORDS) {
      return log.end(
        ctx,
        Response.json(
          { error: 'Tell us more — we need at least a few sentences to write a great song.' },
          { status: 400 }
        )
      );
    }
    // ── Validate env vars ───────────────────────────────────────────────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!anthropicKey || !stripeKey || !priceId) {
      log.warn(ctx.reqId, 'Missing env vars');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    // ── Sanitize intake (defend against oversized payloads) ────────────────
    const recipientName = (body.parsedName ?? '').trim().slice(0, 100) || 'Birthday Person';

    const intake: IntakeData = {
      freeformContext: freeform.slice(0, 3000),
    };

    // ── Generate lyrics + Suno style via Claude (or use pre-generated) ────
    let generated: { lyrics: string; suno_style: string };

    if (body.preGeneratedLyrics && body.preGeneratedStyle) {
      // Lyrics already generated at the preview step — skip Claude entirely
      log.info(ctx.reqId, 'Using pre-generated lyrics');
      generated = {
        lyrics: body.preGeneratedLyrics.slice(0, 10000),
        suno_style: body.preGeneratedStyle.slice(0, 1000),
      };
    } else {
      log.info(ctx.reqId, 'Calling Claude');
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const userMessage = buildUserMessage(intake);

      const claudeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SONG_GENERATION_SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] as any,
        messages: [{ role: 'user', content: userMessage }],
      });

      // Web search inserts server_tool_use + result blocks before the final text — use findLast
      const rawContent = claudeRes.content.findLast((b) => b.type === 'text');
      if (!rawContent || rawContent.type !== 'text')
        throw new Error('Unexpected Claude response type');

      try {
        // Claude sometimes wraps JSON in prose or markdown — extract the object directly
        const jsonMatch = rawContent.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found');
        generated = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Failed to parse Claude response as JSON');
      }

      log.info(ctx.reqId, 'Lyrics generated', { chars: generated.lyrics.length });
    }

    // ── Save order to Supabase ─────────────────────────────────────────────
    const db = supabaseAdmin();
    const { data: order, error: dbError } = await db
      .from('orders')
      .insert({
        buyer_email: '',
        recipient_name: recipientName,
        intake_data: intake,
        lyrics: generated.lyrics,
        suno_style: generated.suno_style,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (dbError || !order) {
      throw new Error(`Supabase insert failed: ${dbError?.message}`);
    }

    log.info(ctx.reqId, 'Order saved', { orderId: order.id });

    // ── Create Stripe Checkout Session ─────────────────────────────────────
    const stripe = new Stripe(stripeKey);
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/create/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/create`,
      metadata: { orderId: order.id },
      allow_promotion_codes: true,
    });

    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    log.info(ctx.reqId, 'Stripe session created', { sessionId: session.id });

    // First 8 non-empty lines — teased in the preview step before Stripe redirect
    const lyricsPreview = generated.lyrics
      .split('\n')
      .filter((l: string) => l.trim())
      .slice(0, 8)
      .join('\n');

    return log.end(
      ctx,
      Response.json({ orderId: order.id, stripeUrl: session.url, lyricsPreview })
    );
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildUserMessage(intake: IntakeData): string {
  return [
    `About the birthday person (their story, quirks, relationships, and details are all in here):`,
    '',
    intake.freeformContext,
    '',
    `Use web search to research the sound and style of any artists, genres, or cultural references mentioned above before writing. Search broadly — the more specific and current your knowledge, the better the song.`,
  ].join('\n');
}
