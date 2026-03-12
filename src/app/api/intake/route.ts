import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import type { IntakeData, VibeType } from '@/lib/types';
import { SONG_GENERATION_SYSTEM_PROMPT } from '@/content/prompts/song-generation';

const log = createRouteLogger('intake');

const VALID_VIBES: VibeType[] = ['heartfelt', 'hype', 'roast', 'kids'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IntakeBody extends IntakeData {
  email: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<IntakeBody>;
    log.info(ctx.reqId, 'Request received', { name: body.recipientName });

    // ── Validate input ──────────────────────────────────────────────────────
    if (!body.recipientName?.trim() || !body.age?.trim()) {
      return log.end(ctx, Response.json({ error: 'Missing required fields' }, { status: 400 }));
    }
    if (!body.insideJoke?.trim()) {
      return log.end(
        ctx,
        Response.json({ error: 'At least one detail is required' }, { status: 400 })
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
    const intake: IntakeData = {
      recipientName: body.recipientName.trim().slice(0, 100),
      nickname: (body.nickname ?? '').trim().slice(0, 100),
      age: body.age.trim().slice(0, 10),
      relationship: (body.relationship ?? '').trim().slice(0, 50),
      innerCircle: (body.innerCircle ?? '').trim().slice(0, 500),
      insideJoke: body.insideJoke.trim().slice(0, 300),
      recentContext: (body.recentContext ?? '').trim().slice(0, 300),
      personalityTrait: (body.personalityTrait ?? '').trim().slice(0, 300),
      vibe: body.vibe,
      musicReference: (body.musicReference ?? '').trim().slice(0, 300),
    };

    // ── Generate lyrics + Suno style via Claude ────────────────────────────
    log.info(ctx.reqId, 'Calling Claude');
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const userMessage = buildUserMessage(intake);

    const claudeRes = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
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
        recipient_name: intake.recipientName,
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
      success_url: `${origin}/create/confirmed?order_id=${order.id}`,
      cancel_url: `${origin}/create`,
      metadata: { orderId: order.id },
      customer_email: body.email.trim().toLowerCase(),
    });

    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    log.info(ctx.reqId, 'Stripe session created', { sessionId: session.id });
    return log.end(ctx, Response.json({ orderId: order.id, stripeUrl: session.url }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildUserMessage(intake: IntakeData): string {
  const details = [intake.insideJoke, intake.recentContext, intake.personalityTrait]
    .filter(Boolean)
    .map((d, i) => `${i + 1}. ${d}`)
    .join('\n');

  const lines = [
    `Recipient: ${intake.recipientName}, turning ${intake.age}`,
    intake.nickname && `Nickname: ${intake.nickname}`,
    intake.relationship && `Buyer's relationship: ${intake.relationship}`,
    intake.innerCircle && `Inner circle (name-drop these people): ${intake.innerCircle}`,
    `Details about them:`,
    details,
    `Vibe: ${intake.vibe}`,
    intake.musicReference && `Music reference (artist, song, or genre): ${intake.musicReference}`,
  ].filter(Boolean);

  return lines.join('\n').trim();
}
