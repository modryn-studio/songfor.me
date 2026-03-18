import { createRouteLogger } from '@/lib/route-logger';
import Anthropic from '@anthropic-ai/sdk';
import { INTERVIEW_SYSTEM_PROMPT } from '@/content/prompts/song-generation';

const log = createRouteLogger('interview');

const FALLBACK = {
  question: 'What genre of music do they love? Any favorite artists?',
  genreOptions: ['Pop', 'Country', 'Hip-hop', 'Rock'],
};

interface InterviewBody {
  freeformContext: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as Partial<InterviewBody>;
    const freeformContext = body.freeformContext?.trim() ?? '';

    log.info(ctx.reqId, 'Request received', { chars: freeformContext.length });

    if (!freeformContext) {
      return log.end(ctx, Response.json(FALLBACK));
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      log.warn(ctx.reqId, 'Missing ANTHROPIC_API_KEY');
      return log.end(ctx, Response.json(FALLBACK));
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: INTERVIEW_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: freeformContext }],
    });

    const raw = claudeRes.content.find((b) => b.type === 'text');
    if (!raw || raw.type !== 'text') {
      log.warn(ctx.reqId, 'No text block in Claude response');
      return log.end(ctx, Response.json(FALLBACK));
    }

    const clean = raw.text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log.warn(ctx.reqId, 'No JSON in Claude response');
      return log.end(ctx, Response.json(FALLBACK));
    }

    const parsed = JSON.parse(jsonMatch[0]) as { question?: string; genreOptions?: string[] };

    const question =
      typeof parsed.question === 'string' && parsed.question.trim()
        ? parsed.question.trim()
        : FALLBACK.question;

    const genreOptions =
      Array.isArray(parsed.genreOptions) && parsed.genreOptions.length >= 2
        ? parsed.genreOptions.slice(0, 5)
        : FALLBACK.genreOptions;

    log.info(ctx.reqId, 'Interview generated', { genres: genreOptions.length });
    return log.end(ctx, Response.json({ question, genreOptions }));
  } catch (error) {
    log.err(ctx, error);
    return log.end(ctx, Response.json(FALLBACK));
  }
}
