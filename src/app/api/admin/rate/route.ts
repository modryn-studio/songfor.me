import { createRouteLogger } from '@/lib/route-logger';
import { supabaseAdmin } from '@/lib/supabase';

const log = createRouteLogger('admin-rate');

function isAuthorized(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get('Authorization') === `Bearer ${pw}`;
}

export async function PATCH(req: Request): Promise<Response> {
  const ctx = log.begin();

  if (!isAuthorized(req)) {
    return log.end(ctx, Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const { orderId, rating } = (await req.json()) as { orderId: string; rating: number };

    if (!orderId || ![1, 2, 3].includes(rating)) {
      return log.end(ctx, Response.json({ error: 'Invalid payload' }, { status: 400 }));
    }

    const db = supabaseAdmin();
    const { error } = await db.from('orders').update({ quality_rating: rating }).eq('id', orderId);

    if (error) throw error;

    log.info(ctx.reqId, 'Rating saved', { orderId, rating });
    return log.end(ctx, Response.json({ ok: true }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
