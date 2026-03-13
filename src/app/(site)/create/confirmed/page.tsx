import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { site } from '@/config/site';
import FeedbackWidget from '@/components/feedback-widget';
import ConfirmedContent from './page-content';

export const metadata: Metadata = {
  title: `Song on its way! — ${site.name}`,
  description:
    "Your personalized birthday song is being crafted. We'll email it to you in ~15 minutes.",
  robots: { index: false },
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) notFound();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) notFound();

  // Verify payment with Stripe — never trust the URL param alone
  const stripe = new Stripe(stripeKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  // Accept 'paid' (card payment) and 'no_payment_required' (100% off promo code)
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required')
    notFound();

  const orderId = session.metadata?.orderId;
  if (!orderId) notFound();

  const db = supabaseAdmin();
  const { data: order } = await db
    .from('orders')
    .select('buyer_email, recipient_name, status')
    .eq('id', orderId)
    .single();

  if (!order) notFound();

  // Idempotently mark as paid
  if (order.status === 'pending_payment') {
    await db.from('orders').update({ status: 'paid' }).eq('id', orderId);
  }

  return (
    <>
      <ConfirmedContent email={order.buyer_email} name={order.recipient_name} />
      <FeedbackWidget />
    </>
  );
}
