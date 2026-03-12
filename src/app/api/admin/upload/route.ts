import { createRouteLogger } from '@/lib/route-logger';
import { supabaseAdmin } from '@/lib/supabase';

const log = createRouteLogger('admin-upload');

const BUCKET = 'songs';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — well above any realistic MP3/WAV

function isAuthorized(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get('Authorization') === `Bearer ${pw}`;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  if (!isAuthorized(req)) {
    return log.end(ctx, Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const form = await req.formData();
    const orderId = form.get('orderId');
    const file = form.get('file');

    if (typeof orderId !== 'string' || !orderId) {
      return log.end(ctx, Response.json({ error: 'orderId is required' }, { status: 400 }));
    }
    if (!(file instanceof File)) {
      return log.end(ctx, Response.json({ error: 'file is required' }, { status: 400 }));
    }
    if (file.size > MAX_FILE_SIZE) {
      return log.end(ctx, Response.json({ error: 'File too large (max 50 MB)' }, { status: 413 }));
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const path = `${orderId}.${ext}`;

    log.info(ctx.reqId, 'Uploading to Storage', { orderId, path, size: file.size });

    const db = supabaseAdmin();
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || 'audio/mpeg', upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
    const audioUrl = urlData.publicUrl;

    log.info(ctx.reqId, 'Upload complete', { audioUrl });
    return log.end(ctx, Response.json({ audioUrl }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
