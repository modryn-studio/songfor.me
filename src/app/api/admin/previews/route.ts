import { createRouteLogger } from '@/lib/route-logger';
import { supabaseAdmin } from '@/lib/supabase';

const log = createRouteLogger('admin-previews');

function isAuthorized(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get('Authorization') === `Bearer ${pw}`;
}

export async function GET(req: Request): Promise<Response> {
  const ctx = log.begin();

  if (!isAuthorized(req)) {
    return log.end(ctx, Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('previews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    log.info(ctx.reqId, 'Previews fetched', { count: data?.length ?? 0 });
    return log.end(ctx, Response.json({ previews: data }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
