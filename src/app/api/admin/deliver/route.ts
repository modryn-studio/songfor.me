import { createRouteLogger } from '@/lib/route-logger';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { SongDeliveryEmail } from '@/emails/song-delivery';

const log = createRouteLogger('admin-deliver');

function isAuthorized(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get('Authorization') === `Bearer ${pw}`;
}

function extractLyricsPreview(lyrics: string): string {
  const lines = lyrics.split('\n');
  const preview: string[] = [];
  let started = false;
  for (const line of lines) {
    if (line.match(/^\[.+\]$/) && started) break;
    if (line.match(/^\[.+\]$/)) {
      started = true;
      continue;
    }
    if (started && line.trim()) preview.push(line);
  }
  return preview.slice(0, 6).join('\n').trim();
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  if (!isAuthorized(req)) {
    return log.end(ctx, Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const body = (await req.json()) as { orderId?: string; audioUrl?: string };

    if (!body.orderId || !body.audioUrl) {
      return log.end(
        ctx,
        Response.json({ error: 'orderId and audioUrl are required' }, { status: 400 })
      );
    }

    const db = supabaseAdmin();

    // Fetch the order
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single();

    if (orderErr || !order) {
      return log.end(ctx, Response.json({ error: 'Order not found' }, { status: 404 }));
    }

    log.info(ctx.reqId, 'Order found', { orderId: order.id, recipient: order.recipient_name });

    // Create song record
    const { data: song, error: songErr } = await db
      .from('songs')
      .insert({
        order_id: order.id,
        recipient_name: order.recipient_name,
        lyrics: order.lyrics,
        suno_style: order.suno_style,
        audio_url: body.audioUrl,
        is_public: true,
      })
      .select()
      .single();

    if (songErr || !song) {
      throw new Error(`Failed to create song: ${songErr?.message}`);
    }

    // Update order status
    await db.from('orders').update({ song_id: song.id, status: 'delivered' }).eq('id', order.id);

    log.info(ctx.reqId, 'Song record created', { songId: song.id });

    // Send delivery email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'songfor.me <hello@modrynstudio.com>';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://songfor.gift';

    if (resendKey) {
      const resend = new Resend(resendKey);
      const songUrl = `${siteUrl}/song/${song.id}`;
      const lyricsPreview = extractLyricsPreview(order.lyrics ?? '');

      await resend.emails.send({
        from: fromEmail,
        to: order.buyer_email,
        subject: `🎵 ${order.recipient_name}'s birthday song is ready!`,
        react: SongDeliveryEmail({
          recipientName: order.recipient_name,
          songUrl,
          lyricsPreview,
        }),
      });

      log.info(ctx.reqId, 'Delivery email sent', { to: order.buyer_email });
    } else {
      log.warn(ctx.reqId, 'RESEND_API_KEY not set — email skipped');
    }

    return log.end(ctx, Response.json({ success: true, songId: song.id }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
