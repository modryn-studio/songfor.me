import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import type { IntakeData, VibeType } from '@/lib/types';
import { SONG_GENERATION_SYSTEM_PROMPT } from '@/content/prompts/song-generation';

const log = createRouteLogger('intake');

const VALID_VIBES: VibeType[] = ['heartfelt', 'hype', 'roast', 'kids', 'surprise'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FREEFORM_WORDS = 15;

interface IntakeBody {
  freeformContext: string;
  parsedName?: string;
  vibe: VibeType;
  musicReference: string;
  email: string;
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
    if (!body.vibe || !VALID_VIBES.includes(body.vibe)) {
      return log.end(ctx, Response.json({ error: 'Invalid vibe' }, { status: 400 }));
    }
    if (!body.musicReference?.trim()) {
      return log.end(ctx, Response.json({ error: 'Music reference is required' }, { status: 400 }));
    }
    if (!body.email || !EMAIL_REGEX.test(body.email)) {
      return log.end(ctx, Response.json({ error: 'Valid email required' }, { status: 400 }));
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
      vibe: body.vibe,
      musicReference: body.musicReference.trim().slice(0, 300),
    };

    // ── Generate lyrics + Suno style via Claude ────────────────────────────
    log.info(ctx.reqId, 'Calling Claude');
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const userMessage = buildUserMessage(intake);

    const claudeRes = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      system: SONG_GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = claudeRes.content[0];
    if (rawContent.type !== 'text') throw new Error('Unexpected Claude response type');

    let generated: { lyrics: string; suno_style: string };
    try {
      const clean = rawContent.text
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      generated = JSON.parse(clean);
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    log.info(ctx.reqId, 'Lyrics generated', { chars: generated.lyrics.length });

    // ── Save order to Supabase ─────────────────────────────────────────────
    const db = supabaseAdmin();
    const { data: order, error: dbError } = await db
      .from('orders')
      .insert({
        buyer_email: body.email.trim().toLowerCase(),
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
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/create/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/create`,
      metadata: { orderId: order.id },
      customer_email: body.email.trim().toLowerCase(),
      allow_promotion_codes: true,
      payment_method_collection: 'if_required',
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
    `About the birthday person (this is your raw material — the story, quirks, relationships, and details are all in here):`,
    '',
    intake.freeformContext,
    '',
    `Vibe: ${intake.vibe}`,
    `Sound/genre reference: ${intake.musicReference}`,
  ].join('\n');
}
