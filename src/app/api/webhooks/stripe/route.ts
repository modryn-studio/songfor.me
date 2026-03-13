import { createRouteLogger } from '@/lib/route-logger';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

const log = createRouteLogger('webhooks-stripe');

// Raw body is required for Stripe signature verification — do NOT call req.json() here.
export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret || !stripeKey) {
      log.warn(ctx.reqId, 'Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      return log.end(ctx, Response.json({ error: 'Missing signature' }, { status: 400 }));
    }

    // Read raw body as ArrayBuffer for signature verification
    const rawBody = await req.arrayBuffer();
    const stripe = new Stripe(stripeKey);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signature verification failed';
      log.warn(ctx.reqId, `Webhook signature invalid: ${msg}`);
      return log.end(ctx, Response.json({ error: 'Invalid signature' }, { status: 400 }));
    }

    log.info(ctx.reqId, 'Event received', { type: event.type });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const customerEmail = session.customer_email ?? session.customer_details?.email ?? '';

      if (!orderId) {
        log.warn(ctx.reqId, 'No orderId in session metadata');
        return log.end(ctx, Response.json({ received: true }));
      }

      const db = supabaseAdmin();
      const { error } = await db
        .from('orders')
        .update({ buyer_email: customerEmail, status: 'paid' })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
      }

      log.info(ctx.reqId, 'Order marked paid', { orderId, email: customerEmail });
    }

    return log.end(ctx, Response.json({ received: true }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
