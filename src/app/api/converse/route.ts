import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import { CONVERSE_SYSTEM_PROMPT } from '@/content/prompts/song-generation';
import { supabaseAdmin } from '@/lib/supabase';

const log = createRouteLogger('converse');

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConverseBody {
  messages: ConversationMessage[];
  parsedName?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<ConverseBody>;
    log.info(ctx.reqId, 'Request received', {
      name: body.parsedName,
      turns: body.messages?.length,
    });

    // ── Validate ────────────────────────────────────────────────────────────
    const messages = body.messages ?? [];
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return log.end(
        ctx,
        Response.json({ error: 'messages must be non-empty with last role=user' }, { status: 400 })
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      log.warn(ctx.reqId, 'Missing ANTHROPIC_API_KEY');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    // ── Call Claude with full conversation history ──────────────────────────
    log.info(ctx.reqId, 'Calling Claude');
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: CONVERSE_SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] as any,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    // Web search inserts server_tool_use + result blocks before the final text — use findLast
    const rawContent = claudeRes.content.findLast((b) => b.type === 'text');
    if (!rawContent || rawContent.type !== 'text') {
      throw new Error('Unexpected Claude response type');
    }

    // ── Parse response ──────────────────────────────────────────────────────
    const text = rawContent.text.trim();

    // Strip optional markdown fences
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    // Try to extract a JSON structure (array or object)
    const jsonMatch = clean.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error('No JSON found in Claude response');

    const parsed = JSON.parse(jsonMatch[0]);

    // ── Questions turn ──────────────────────────────────────────────────────
    if (Array.isArray(parsed)) {
      const questions = (parsed as unknown[])
        .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
        .slice(0, 5);

      log.info(ctx.reqId, 'Questions round', { count: questions.length });
      return log.end(ctx, Response.json({ type: 'questions', questions }));
    }

    // ── Song turn ───────────────────────────────────────────────────────────
    if (typeof parsed?.lyrics === 'string' && typeof parsed?.suno_style === 'string') {
      const { lyrics, suno_style } = parsed as { lyrics: string; suno_style: string };

      log.info(ctx.reqId, 'Song generated', { chars: lyrics.length });

      // Fire-and-forget — log preview for conversion tracking
      supabaseAdmin()
        .from('previews')
        .insert({
          recipient_name: body.parsedName ?? '',
          freeform_context: messages[0]?.content.slice(0, 3000) ?? '',
          lyrics,
          suno_style,
        })
        .then(({ error }) => {
          if (error) log.warn(ctx.reqId, 'Failed to log preview', { error: error.message });
        });

      const lyricsPreview = lyrics
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 8)
        .join('\n');

      return log.end(
        ctx,
        Response.json({ type: 'song', lyrics, sunoStyle: suno_style, lyricsPreview })
      );
    }

    throw new Error('Claude returned neither a questions array nor a song object');
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
