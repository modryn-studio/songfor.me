import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';

const log = createRouteLogger('clarify');

const CLARIFY_SYSTEM_PROMPT_R1 = `You are helping a songwriter gather details before writing a personalized birthday song.

Read the brief below and ask exactly 2–3 targeted questions. Focus on:
- Music they love — artists, genres, or "sounds like X" if not already mentioned
- The birthday person's personality or energy (not physical appearance)
- Specific people who will be there (crew, close friends, family)
- Any phrases, sayings, nicknames, or stories that define them
- Concrete details about things mentioned (e.g. if a motorcycle is mentioned, what kind?)

Rules:
- Ask exactly 2–3 questions — not 1, not 4
- Only ask about things NOT already in the brief
- Keep each question short and conversational

Return ONLY a valid JSON array of question strings. No prose, no markdown:
["question 1", "question 2", "question 3"]`;

const CLARIFY_SYSTEM_PROMPT_R2 = `You are helping a songwriter gather details before writing a personalized birthday song. You are reviewing an enriched brief that already includes some follow-up Q&A.

Your job: decide if there is enough detail to write a specific, personal song.
If yes — you have: a name, an age or milestone, personality details, at least one specific memory/quirk/phrase, and a sense of music taste — return an empty array.

If gaps remain that would meaningfully improve the song, ask 1–5 targeted questions. Focus only on the most impactful missing details.

Return ONLY a valid JSON array. May be empty:
[]  or  ["question 1", "question 2"]`;

interface ClarifyBody {
  freeformContext: string;
  round?: 1 | 2;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<ClarifyBody>;

    const freeform = body.freeformContext?.trim() ?? '';

    if (!freeform) {
      return log.end(ctx, Response.json({ error: 'freeformContext is required' }, { status: 400 }));
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      log.warn(ctx.reqId, 'Missing ANTHROPIC_API_KEY');
      return log.end(ctx, Response.json({ error: 'Service unavailable' }, { status: 503 }));
    }

    const round = body.round ?? 1;
    const systemPrompt = round === 2 ? CLARIFY_SYSTEM_PROMPT_R2 : CLARIFY_SYSTEM_PROMPT_R1;
    const userMessage = ['About the birthday person:', '', freeform.slice(0, 3000)].join('\n');

    log.info(ctx.reqId, 'Calling Claude for clarify questions', { round });
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = claudeRes.content.find((b) => b.type === 'text');
    if (!rawContent || rawContent.type !== 'text') {
      throw new Error('Unexpected Claude response type');
    }

    let questions: string[];
    try {
      const clean = rawContent.text
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      questions = JSON.parse(clean);
      if (!Array.isArray(questions)) throw new Error('Not an array');
      questions = questions.filter((q) => typeof q === 'string' && q.trim()).slice(0, 5);
    } catch {
      throw new Error('Failed to parse Claude response as JSON array');
    }

    log.info(ctx.reqId, 'Questions generated', { count: questions.length });

    return log.end(ctx, Response.json({ questions }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
