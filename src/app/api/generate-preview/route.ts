import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import type { IntakeData } from '@/lib/types';
import { SONG_GENERATION_SYSTEM_PROMPT } from '@/content/prompts/song-generation';
import { supabaseAdmin } from '@/lib/supabase';

const log = createRouteLogger('generate-preview');

const MIN_FREEFORM_WORDS = 15;

interface GeneratePreviewBody {
  freeformContext: string;
  parsedName?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<GeneratePreviewBody>;
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
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      log.warn(ctx.reqId, 'Missing ANTHROPIC_API_KEY');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    const intake: IntakeData = {
      freeformContext: freeform.slice(0, 3000),
    };

    // ── Generate lyrics + Suno style via Claude ────────────────────────────
    log.info(ctx.reqId, 'Calling Claude');
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SONG_GENERATION_SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] as any,
      messages: [{ role: 'user', content: buildUserMessage(intake) }],
    });

    // Web search inserts server_tool_use + result blocks before the final text — use findLast
    const rawContent = claudeRes.content.findLast((b) => b.type === 'text');
    if (!rawContent || rawContent.type !== 'text')
      throw new Error('Unexpected Claude response type');

    let generated: { lyrics: string; suno_style: string };
    try {
      // Claude sometimes wraps JSON in prose or markdown — extract the object directly
      const jsonMatch = rawContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found');
      generated = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    log.info(ctx.reqId, 'Lyrics generated', { chars: generated.lyrics.length });

    // Fire-and-forget — log this preview to Supabase for conversion tracking
    supabaseAdmin()
      .from('previews')
      .insert({
        recipient_name: body.parsedName ?? '',
        freeform_context: freeform.slice(0, 3000),
        lyrics: generated.lyrics,
        suno_style: generated.suno_style,
      })
      .then(({ error }) => {
        if (error) log.warn(ctx.reqId, 'Failed to log preview', { error: error.message });
      });

    const lyricsPreview = generated.lyrics
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 8)
      .join('\n');

    return log.end(
      ctx,
      Response.json({
        lyrics: generated.lyrics,
        sunoStyle: generated.suno_style,
        lyricsPreview,
      })
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
