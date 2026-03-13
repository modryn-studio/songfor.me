import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import type { IntakeData, VibeType } from '@/lib/types';
import { SONG_GENERATION_SYSTEM_PROMPT } from '@/content/prompts/song-generation';

const log = createRouteLogger('generate-preview');

const VALID_VIBES: VibeType[] = ['heartfelt', 'hype', 'roast', 'kids', 'surprise'];
const MIN_FREEFORM_WORDS = 15;

interface GeneratePreviewBody {
  freeformContext: string;
  parsedName?: string;
  vibe: VibeType;
  musicReference: string;
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
    if (!body.vibe || !VALID_VIBES.includes(body.vibe)) {
      return log.end(ctx, Response.json({ error: 'Invalid vibe' }, { status: 400 }));
    }
    if (!body.musicReference?.trim()) {
      return log.end(ctx, Response.json({ error: 'Music reference is required' }, { status: 400 }));
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      log.warn(ctx.reqId, 'Missing ANTHROPIC_API_KEY');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    const intake: IntakeData = {
      freeformContext: freeform.slice(0, 3000),
      vibe: body.vibe,
      musicReference: body.musicReference.trim().slice(0, 300),
    };

    // ── Generate lyrics + Suno style via Claude ────────────────────────────
    log.info(ctx.reqId, 'Calling Claude');
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const claudeRes = await anthropic.messages.create({
      model: 'claude-opus-4-6',
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
      const clean = rawContent.text
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      generated = JSON.parse(clean);
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    log.info(ctx.reqId, 'Lyrics generated', { chars: generated.lyrics.length });

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
    `Vibe: ${intake.vibe}`,
    `Sound/genre reference: ${intake.musicReference}`,
    '',
    `Use web search to research the sound and style of any artists, genres, or cultural references mentioned above before writing. Search broadly — the more specific and current your knowledge, the better the song.`,
  ].join('\n');
}
