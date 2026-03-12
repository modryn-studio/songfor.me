import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  if (!order_id) notFound();

  const db = supabaseAdmin();
  const { data: order } = await db
    .from('orders')
    .select('buyer_email, recipient_name, status')
    .eq('id', order_id)
    .single();

  if (!order) notFound();

  // Idempotently mark as paid — Stripe only redirects here on successful payment
  if (order.status === 'pending_payment') {
    await db.from('orders').update({ status: 'paid' }).eq('id', order_id);
  }

  return (
    <>
      <ConfirmedContent email={order.buyer_email} name={order.recipient_name} />
      <FeedbackWidget />
    </>
  );
}
