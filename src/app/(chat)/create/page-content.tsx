'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type StepId = 'freeform' | 'interview' | 'clarify' | 'generating' | 'preview';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IntakeAnswers {
  freeform: string;
}

interface PreviewData {
  stripeUrl: string;
  lyricsPreview: string;
}

// ── Placeholder examples (from real prompts) ─────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  "Monica is turning 12. Party with a trampoline, camping tent, and s'mores around the fire pit. She loves dancing and all her friends will be there...",
  'Nick is turning 37. His girlfriend Kathy calls him Slay Baddie Snickers. He loves jet skis and just got a new motorcycle. Small party with the kids in his cool basement...',
  "Paula is turning 34, pregnant with baby Alex. I'm her husband Luke. We have an 8 yr old Aria, a dog Snowbell, and four cats. She collects plants and Pokémon cards...",
];

const ARTIST_EXAMPLES = [
  'Drake',
  'Johnny Cash',
  'Taylor Swift',
  'Kendrick Lamar',
  'Metallica',
  'Beyoncé',
] as const;

// ── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(examples: readonly string[], active: boolean, holdMs = 3000) {
  const [text, setText] = useState('');
  const stateRef = useRef({ idx: 0, charIdx: 0, deleting: false });

  useEffect(() => {
    if (!active) {
      setText('');
      return;
    }

    const s = stateRef.current;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const current = examples[s.idx];

      if (!s.deleting) {
        s.charIdx++;
        setText(current.slice(0, s.charIdx));
        if (s.charIdx >= current.length) {
          s.deleting = true;
          timer = setTimeout(tick, holdMs); // pause at full text
        } else {
          timer = setTimeout(tick, 35);
        }
      } else {
        s.charIdx--;
        setText(current.slice(0, s.charIdx));
        if (s.charIdx <= 0) {
          s.deleting = false;
          s.idx = (s.idx + 1) % examples.length;
          timer = setTimeout(tick, 400);
        } else {
          timer = setTimeout(tick, 15);
        }
      }
    }

    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [active, examples, holdMs]);

  return text;
}

// ── Quality scoring (freeform heuristics) ────────────────────────────────────

function calcQualityScore(text: string): number {
  if (!text.trim()) return 0;
  let score = 0;

  // Strip chip starter phrases so clicking chips without filling them in doesn't inflate the score.
  // Trailing \s* makes the space optional — if user deletes it, the bare phrase still gets stripped.
  const cleaned = NUDGE_CHIPS.reduce((t, chip) => {
    const escaped = chip.append.trimEnd().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp(escaped + '\\s*', 'gi'), ' ');
  }, text).trim();

  if (!cleaned) return 0;

  // Name mentioned via a recognisable phrase (case-insensitive, catches "her name is aria")
  // Also catches "Monica is 12" — capital name directly followed by "is"
  if (
    /(?:name is|named|it'?s? for|called|he'?s?|she'?s?|they'?re)\s+\w/i.test(cleaned) ||
    /\b[A-Z][a-z]+\s+is\b/.test(cleaned)
  )
    score += 15;

  // Has a number (age)
  if (/\b\d{1,3}\b/.test(cleaned)) score += 10;

  // Mentions multiple capitalised proper names (bonus signal for real content)
  const nameMatches = cleaned.match(/\b[A-Z][a-z]{2,}\b/g);
  if (nameMatches && new Set(nameMatches).size >= 3) score += 15;

  // Word count
  const words = cleaned.trim().split(/\s+/).length;
  if (words > 20) score += 8;
  if (words > 40) score += 8;
  if (words > 60) score += 9;

  // Specific details (quotes, nicknames, inside jokes)
  if (/["'"].+["'"]|calls?\s+(them|him|her|me)|nickname|inside joke|always says/i.test(cleaned))
    score += 15;

  // Relationship mention
  if (
    /\b(mom|dad|husband|wife|friends?|sister|brother|sons?|daughters?|kids?|partner|girlfriend|boyfriend|family|aunt|uncle|grandm[ao][mt]?|grandpa|grandfather|grandmother|niece|nephew|cousin)\b/i.test(
      cleaned
    )
  )
    score += 10;

  // Activity / event mention
  if (
    /\b(party|birthday|bday|celebration|dinner|trip|surprise|cake|gifts?|presents?)\b/i.test(
      cleaned
    )
  )
    score += 10;

  // Hobbies / interests (catches "she loves to dance", "he's into cars", "obsessed with Pokémon")
  if (
    /\b(loves?|likes?|enjoys?|into|obsessed|fan of|collects?|plays?|watches?|reads?|makes?)\b/i.test(
      cleaned
    )
  )
    score += 10;

  return Math.min(score, 100);
}

// ── Nudge chips ──────────────────────────────────────────────────────────────

const NUDGE_CHIPS: { label: string; append: string }[] = [
  { label: 'Their name?', append: 'Their name is ' },
  { label: 'How old?', append: "They're turning " },
  { label: 'Any nicknames?', append: 'Everyone calls them ' },
  { label: "Who'll be there?", append: 'The people there will be ' },
  { label: 'What are they into?', append: 'They love ' },
];

// ── Crafting messages (cycling during generation) ────────────────────────────

const CRAFTING_MESSAGES: Array<(name: string) => string> = [
  (name) => `Getting to know ${name || 'them'} through every detail you shared...`,
  () => 'Crafting the opening hook...',
  () => 'Searching for the right words...',
  () => 'This may take a minute — writing something worth waiting for.',
  (name) => `Building the chorus around ${name || 'them'}...`,
  () => "Finding the rhyme that'll stop the room...",
  () => 'Layering in the details that make it personal...',
  () => 'Shaping the bridge...',
  () => 'Making every line earn its place...',
  () => 'Almost there — finishing the final verse...',
];

// ── Name / age extraction ────────────────────────────────────────────────────

// Common words that start sentences or phrases but are never a person's name.
const NAME_BLOCKLIST = new Set([
  'my',
  'she',
  'he',
  'they',
  'their',
  'our',
  'his',
  'her',
  'its',
  'this',
  'that',
  'we',
  'you',
  'the',
  'a',
  'an',
  'so',
  'just',
  'really',
]);

function parseName(text: string): string {
  const patterns = [
    // Birthday-person-specific signals first
    /\b([A-Z][a-z]+)\s+is\s+turning\b/,
    /\b([A-Z][a-z]+)\s+turns\s+\d/,
    /(?:song for|birthday for|making.*?for|it's for)\s+([A-Z][a-z]+)/i,
    /(?:his|her|their)\s+name\s+is\s+([A-Z][a-z]+)/i,
    // Fallback: generic "named/for/called" — less reliable in context-rich briefs
    /(?:^|\bsong\b.*?)\bfor\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]+)\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    // Guard: must start with uppercase and must not be a common non-name word.
    if (m && /^[A-Z]/.test(m[1]) && !NAME_BLOCKLIST.has(m[1].toLowerCase())) return m[1];
  }
  return '';
}

// ── Quality ring ─────────────────────────────────────────────────────────────

function QualityRing({ score, className }: { score: number; className?: string }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#ff6b6b';
  const label =
    score >= 70
      ? 'This already feels personal'
      : score >= 40
        ? 'Great start — add one more detail'
        : 'A few more details will make this hit';

  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-0.5', className)} title={label}>
      <div className="relative h-11 w-11">
        <svg className="-rotate-90" width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#e8ded6" strokeWidth="3.5" />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
          style={{ color }}
        >
          {score}%
        </span>
      </div>
      <span className="text-muted max-w-20 text-center text-[9px] leading-tight">{label}</span>
    </div>
  );
}

const STEP_ORDER: StepId[] = ['freeform', 'interview', 'clarify'];

const STATIC_GENRE_OPTIONS = ['Pop', 'Country', 'Hip-hop', 'Rock'];

function getBotQuestion(step: StepId, _name: string): string {
  switch (step) {
    case 'freeform':
      return "Tell me about them — just write like you're texting a friend. The more personal, the better.";
    case 'interview':
    case 'clarify':
      return '';
    default:
      return '';
  }
}

// ── Lyrics preview card ──────────────────────────────────────────────────────

function LyricsPreviewCard({
  lyricsPreview,
  name,
  sunoStyle,
}: {
  lyricsPreview: string;
  name: string;
  sunoStyle?: string;
}) {
  const lines = lyricsPreview
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const visibleLines = lines.slice(0, 5);
  const blurredLines = lines.slice(5, 9);

  return (
    <div className="border-border bg-surface mx-auto my-2 w-full max-w-[82%] rounded-2xl rounded-tl-sm border px-4 py-3">
      <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
        {name}&apos;s song preview
      </p>
      <div className="space-y-1">
        {visibleLines.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </div>
      {blurredLines.length > 0 && (
        <div className="relative mt-1">
          <div className="space-y-1">
            {blurredLines.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed blur-sm select-none">
                {line}
              </p>
            ))}
          </div>
          <div className="to-surface pointer-events-none absolute inset-0 bg-linear-to-b from-transparent" />
        </div>
      )}
      {sunoStyle && <p className="text-muted mt-3 text-xs italic">♪ {sunoStyle}</p>}
      <p className="text-muted mt-3 text-xs">Unlock the full song below →</p>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="msg-in flex justify-start">
      <div className="border-border bg-surface rounded-2xl rounded-tl-sm border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="bg-muted/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <span className="bg-muted/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <span className="bg-muted/60 h-2 w-2 animate-bounce rounded-full" />
        </div>
      </div>
    </div>
  );
}

function CraftingMessage({ idx, name }: { idx: number; name: string }) {
  const msg = CRAFTING_MESSAGES[idx % CRAFTING_MESSAGES.length](name);
  return (
    <div className="msg-in flex justify-start">
      <div className="border-border bg-surface text-text max-w-[82%] rounded-2xl rounded-tl-sm border px-4 py-3 text-base">
        {msg}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const DRAFT_KEY = 'songforme_draft';
const PERSISTABLE_STEPS: StepId[] = ['freeform', 'interview', 'clarify', 'preview'];

function readDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!PERSISTABLE_STEPS.includes(p.step)) return null;
    if (!Array.isArray(p.messages)) return null;
    // If we're past step 1 but freeform answer is missing, recover to freeform with text
    if (p.step !== 'freeform' && !p.answers?.freeform) return { ...p, step: 'freeform' };
    // Interview step requires genre options and the question text
    if (p.step === 'interview' && (!Array.isArray(p.genreOptions) || !p.interviewQuestion)) {
      return { ...p, step: 'freeform' };
    }
    // Clarify step requires conversationHistory — without it we can't call /api/converse
    if (p.step === 'clarify' && !Array.isArray(p.conversationHistory)) {
      return { ...p, step: 'freeform' };
    }
    // Preview step requires pre-generated lyrics — without them it's not recoverable
    if (p.step === 'preview' && !p.preGenData) return { ...p, step: 'freeform' };
    return p;
  } catch {
    return null;
  }
}

export default function CreateContent() {
  const [step, setStep] = useState<StepId>('freeform');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: getBotQuestion('freeform', '') },
  ]);
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({});
  const [freeformText, setFreeformText] = useState<string>('');
  const [error, setError] = useState('');
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<number, string>>({});
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [preGenData, setPreGenData] = useState<{ lyrics: string; sunoStyle: string } | null>(null);
  const [botTyping, setBotTyping] = useState(false);
  const [craftingMsgIdx, setCraftingMsgIdx] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');

  // Typewriter — active only when textarea is empty and unfocused on step 1
  const [textareaFocused, setTextareaFocused] = useState(false);
  const showTypewriter = step === 'freeform' && !freeformText;
  const typewriterText = useTypewriter(PLACEHOLDER_EXAMPLES, showTypewriter);

  const showArtistTypewriter = step === 'interview' && !favoriteArtist;
  const artistTypewriterText = useTypewriter(ARTIST_EXAMPLES, showArtistTypewriter);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // true during initial mount/draft restoration — instant scroll; false after → smooth
  const skipSmoothScroll = useRef(true);
  // All messages animate in, including the first
  const initialMsgCount = useRef(0);

  const qualityScore = calcQualityScore(freeformText);
  const parsedName = parseName(freeformText);

  // Scroll to bottom on new messages or when typing indicator appears/disappears
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    if (skipSmoothScroll.current) {
      el.scrollIntoView({ block: 'end' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, botTyping]);

  useEffect(() => {
    analytics.intakeStarted();
  }, []);

  // Restore draft after mount — must be in useEffect because localStorage is browser-only.
  // Server and client both render defaults first (no mismatch), then the draft is applied.
  useEffect(() => {
    const d = readDraft();
    if (d) {
      setStep(d.step);
      // Always rewrite the first bot message so copy changes take effect immediately
      // without requiring the user to clear their localStorage draft.
      const restoredMessages = d.messages.map((m: Message, i: number) =>
        i === 0 && m.role === 'bot' ? { ...m, text: getBotQuestion('freeform', '') } : m
      );
      setMessages(restoredMessages);
      setAnswers(d.answers ?? {});
      setFreeformText(d.freeformText ?? '');
      if (d.clarifyQuestions) setClarifyQuestions(d.clarifyQuestions);
      if (d.clarifyAnswers) setClarifyAnswers(d.clarifyAnswers);
      if (d.conversationHistory)
        setConversationHistory(d.conversationHistory as ConversationMessage[]);
      if (d.interviewQuestion) setInterviewQuestion(d.interviewQuestion);
      if (d.genreOptions) setGenreOptions(d.genreOptions);
      if (d.selectedGenre) setSelectedGenre(d.selectedGenre);
      if (d.favoriteArtist) setFavoriteArtist(d.favoriteArtist);
      if (d.preGenData) setPreGenData(d.preGenData);
      if (d.previewData) setPreviewData(d.previewData);
    }
    // Enable smooth scrolling after the initial render + any draft restoration has settled.
    // Double rAF ensures we're past the commit cycle triggered by the state updates above.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        skipSmoothScroll.current = false;
      })
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [freeformText]);

  // Persist full intake draft to localStorage so refresh at any step restores where they left off
  useEffect(() => {
    if (!PERSISTABLE_STEPS.includes(step)) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        step,
        freeformText,
        answers,
        messages,
        clarifyQuestions,
        clarifyAnswers,
        conversationHistory,
        interviewQuestion,
        genreOptions,
        selectedGenre,
        favoriteArtist,
        preGenData,
        previewData,
      })
    );
  }, [
    step,
    freeformText,
    answers,
    messages,
    clarifyQuestions,
    clarifyAnswers,
    conversationHistory,
    interviewQuestion,
    genreOptions,
    selectedGenre,
    favoriteArtist,
    preGenData,
    previewData,
  ]);

  // Cycle crafting messages while generation is in flight
  useEffect(() => {
    if (step !== 'generating') return;
    setCraftingMsgIdx(0);
    const id = setInterval(() => setCraftingMsgIdx((i) => i + 1), 8000);
    return () => clearInterval(id);
  }, [step]);

  // Drive the fake progress bar: 0→85% over ~100s while generating
  useEffect(() => {
    if (step === 'generating') {
      const id = setTimeout(() => setGenProgress(85), 50);
      return () => clearTimeout(id);
    }
    setGenProgress(0);
  }, [step]);

  // ── Message helpers ────────────────────────────────────────────────────────

  function pushMessage(msg: Message) {
    setMessages((prev) => [...prev, msg]);
  }

  // ── Nudge chip handler ─────────────────────────────────────────────────────

  const handleNudgeChip = useCallback((append: string) => {
    setFreeformText((prev) => {
      const sep = prev && !prev.endsWith(' ') ? ' ' : '';
      return prev + sep + append;
    });
    textareaRef.current?.focus();
  }, []);

  // ── Back navigation ────────────────────────────────────────────────────────

  function handleBack() {
    if (botTyping) return;
    const currentIdx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
    if (currentIdx <= 0) return;
    const prevStep = STEP_ORDER[currentIdx - 1];

    // Pop user answer + bot question for current step
    setMessages((prev) => {
      const trimmed = [...prev];
      if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === 'bot') trimmed.pop();
      if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === 'user') trimmed.pop();
      return trimmed;
    });

    switch (prevStep) {
      case 'freeform':
        setAnswers((p) => {
          const n = { ...p };
          delete n.freeform;
          return n;
        });
        setConversationHistory([]);
        setInterviewQuestion('');
        setGenreOptions([]);
        setSelectedGenre('');
        setFavoriteArtist('');
        break;
    }

    setStep(prevStep);
    setError('');
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  async function handleFreeformSubmit() {
    const text = freeformText.trim();
    if (!text) {
      setError('Tell us something about them — even a few sentences helps.');
      return;
    }
    if (text.split(/\s+/).length < 15) {
      setError(
        'A few more details will make this hit — tell us their name, age, and one quirk or inside joke.'
      );
      return;
    }

    setAnswers((p) => ({ ...p, freeform: text }));

    const preview = text.length > 120 ? text.slice(0, 120).replace(/\s+\S*$/, '') + '…' : text;
    setMessages((prev) => [...prev, { role: 'user', text: preview }]);
    setBotTyping(true);
    setError('');
    analytics.intakeStep({ step: 'freeform' });

    // Call /api/interview to get a tailored music question and genre chips
    const interviewFetch = fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freeformContext: text }),
    });

    await new Promise<void>((r) => setTimeout(r, 850));

    let question = 'What genre of music do they love? Any favorite artists?';
    let genres = STATIC_GENRE_OPTIONS;
    try {
      const interviewRes = await interviewFetch;
      if (interviewRes.ok) {
        const data = (await interviewRes.json()) as { question?: string; genreOptions?: string[] };
        if (data.question) question = data.question;
        if (data.genreOptions?.length) genres = data.genreOptions;
      }
    } catch {
      // fallback values already set above
    }

    setInterviewQuestion(question);
    setGenreOptions(genres);
    setMessages((prev) => [...prev, { role: 'bot', text: question }]);
    setBotTyping(false);
    setStep('interview');
  }

  function handleClarifySubmit(skip: boolean) {
    let history = conversationHistory;

    // Build answers regardless — if all blank, treat as skip
    const answersText = clarifyQuestions
      .map((q, i) => {
        const a = clarifyAnswers[i]?.trim();
        return a ? `${q}\n${a}` : null;
      })
      .filter(Boolean)
      .join('\n\n');

    if (!skip && answersText) {
      setMessages((prev) => [...prev, { role: 'user', text: answersText }]);
      history = [
        ...history,
        { role: 'assistant', content: JSON.stringify(clarifyQuestions) },
        { role: 'user', content: answersText },
      ];
      setConversationHistory(history);
    } else {
      // skip=true OR all answers blank — move forward with what we have
      const skipMsg = 'No additional info needed, please write the song.';
      setMessages((prev) => [...prev, { role: 'user', text: skipMsg }]);
      history = [
        ...history,
        { role: 'assistant', content: JSON.stringify(clarifyQuestions) },
        { role: 'user', content: skipMsg },
      ];
      setConversationHistory(history);
    }

    analytics.intakeStep({ step: 'clarify' });
    void sendToConverse(history);
  }

  async function sendToConverse(history: ConversationMessage[]) {
    // Fall back to interview if no clarify questions are loaded yet (first call from interview step)
    const fallbackStep: StepId = clarifyQuestions.length > 0 ? 'clarify' : 'interview';
    setStep('generating');

    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          parsedName: parsedName || '',
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error || 'Converse failed');
      }

      const data = (await res.json()) as
        | { type: 'questions'; questions: string[] }
        | { type: 'song'; lyrics: string; sunoStyle: string; lyricsPreview: string };

      if (data.type === 'questions') {
        setClarifyQuestions(data.questions);
        setClarifyAnswers({});
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: "A few quick questions that'll make this song way more personal:" },
        ]);
        setStep('clarify');
        return;
      }

      // Song is ready
      setPreGenData({ lyrics: data.lyrics, sunoStyle: data.sunoStyle });
      setPreviewData({ lyricsPreview: data.lyricsPreview, stripeUrl: '' });
      localStorage.removeItem(DRAFT_KEY);
      setStep('preview');
    } catch (err) {
      setStep(fallbackStep);
      const msg = err instanceof Error ? err.message : null;
      setError(msg || 'Something went sideways — try again.');
    }
  }

  async function handleInterviewSubmit(surpriseMe: boolean) {
    const genre = selectedGenre;
    const artist = favoriteArtist.trim();
    if (!surpriseMe && !genre && !artist) {
      setError('Pick a genre or enter an artist to continue.');
      return;
    }

    // Build user-facing summary message
    let userMsg = '';
    if (surpriseMe) {
      userMsg = 'Surprise me ✨';
    } else if (artist && genre && genre !== 'Surprise me') {
      userMsg = `Sounds like ${artist}, ${genre.toLowerCase()} style`;
    } else if (artist) {
      userMsg = `Sounds like ${artist}`;
    } else {
      userMsg = genre;
    }

    // Build the music answer for Claude
    const musicAnswer = surpriseMe
      ? 'Surprise me — pick a genre and artist that best fit what you know about them.'
      : [genre && genre !== 'Surprise me' ? genre : '', artist ? `Sounds like ${artist}` : '']
          .filter(Boolean)
          .join('. ');

    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setBotTyping(true);
    setError('');

    // Build 3-message history: freeform brief → interview Q → user's music answer
    const initialHistory: ConversationMessage[] = [
      { role: 'user', content: freeformText.trim() },
      { role: 'assistant', content: interviewQuestion },
      { role: 'user', content: musicAnswer },
    ];
    setConversationHistory(initialHistory);
    analytics.intakeStep({ step: 'interview' });

    await new Promise<void>((r) => setTimeout(r, 850));
    setBotTyping(false);
    void sendToConverse(initialHistory);
  }

  async function handlePayCTA() {
    if (!preGenData) return;
    const displayName = parsedName || 'Birthday Person';

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeformContext: conversationHistory[0]?.content ?? freeformText.trim(),
          parsedName: parsedName || '',
          preGeneratedLyrics: preGenData.lyrics,
          preGeneratedStyle: preGenData.sunoStyle,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = (errBody as { error?: string }).error;
        throw new Error(msg || 'API error');
      }

      const { stripeUrl } = (await res.json()) as { stripeUrl: string | null; orderId: string };
      if (!stripeUrl) throw new Error('Payment link unavailable — please try again.');

      analytics.intakeCompleted({ name: displayName });
      window.location.href = stripeUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg || `Something went sideways. Try again — ${displayName} is worth it.`);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const name = parsedName || '';
  const stepIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const progress =
    step === 'generating' || step === 'preview' ? 100 : (stepIndex / STEP_ORDER.length) * 100;
  const showBack = stepIndex > 0 && step !== 'generating' && step !== 'preview' && !botTyping;
  const showQuality = step === 'freeform' && freeformText.length > 0;

  const nudgeChips = step === 'freeform' ? NUDGE_CHIPS : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-border shrink-0 border-b px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/create"
            aria-label="Start a new song"
            onClick={() => localStorage.removeItem(DRAFT_KEY)}
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <Image src="/brand/logomark.png" alt="songfor.me" width={24} height={24} />
          </Link>
          {showBack && (
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="shrink-0"
              aria-label="Go back one step"
            >
              ← Back
            </Button>
          )}
          <div
            className="bg-border min-w-0 flex-1 overflow-hidden rounded-full"
            style={{ height: '4px' }}
          >
            <div
              className="bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, height: '4px' }}
            />
          </div>
          {step === 'freeform' && (
            <QualityRing score={qualityScore} className={showQuality ? '' : 'invisible'} />
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
                i >= initialMsgCount.current && 'msg-in'
              )}
            >
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-4 py-3 text-base',
                  msg.role === 'bot'
                    ? 'border-border bg-surface text-text rounded-tl-sm border'
                    : 'bg-accent rounded-tr-sm text-white'
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator — shown while bot is composing a response */}
          {botTyping && <TypingIndicator />}

          {/* Crafting messages — cycle during generation */}
          {step === 'generating' && (
            <CraftingMessage key={craftingMsgIdx} idx={craftingMsgIdx} name={name} />
          )}

          {/* Lyrics preview card */}
          {step === 'preview' && previewData && (
            <div className="msg-in">
              <LyricsPreviewCard
                lyricsPreview={previewData.lyricsPreview}
                name={name}
                sunoStyle={preGenData?.sunoStyle}
              />
            </div>
          )}

          {/* Scroll anchor — smooth-scrolled to on every message append */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input panel ────────────────────────────────────────────────────── */}
      <div className="border-border bg-bg/95 shrink-0 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          {/* Typing — spacer keeps panel height stable during transitions */}
          {botTyping && <p className="text-muted py-3 text-center text-sm">&nbsp;</p>}

          {/* Step 1: Freeform */}
          {step === 'freeform' && !botTyping && (
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  onFocus={() => setTextareaFocused(true)}
                  onBlur={() => setTextareaFocused(false)}
                  className="min-h-30 text-base"
                />
                {/* Typewriter placeholder overlay */}
                {showTypewriter && typewriterText && (
                  <div
                    className="text-muted/50 pointer-events-none absolute inset-0 overflow-hidden px-3 py-2 text-base"
                    aria-hidden="true"
                  >
                    {typewriterText}
                    <span
                      className="ml-0.5 inline-block w-0.5 animate-pulse bg-current"
                      style={{ height: '1em', verticalAlign: 'text-bottom' }}
                    />
                  </div>
                )}
              </div>

              {/* Nudge chips — always visible as blank-page starters */}
              <div className="flex flex-wrap gap-1.5">
                {nudgeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => handleNudgeChip(chip.append)}
                    className="border-border text-muted hover:border-accent hover:text-text min-h-11 rounded-full border px-3 py-1 text-xs transition-colors"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>

              <Button onClick={handleFreeformSubmit} className="w-full">
                Continue →
              </Button>
            </div>
          )}

          {/* Interview — genre/artist selection */}
          {step === 'interview' && !botTyping && (
            <div className="space-y-3">
              <p className="text-muted text-xs">An artist they love</p>
              {/* Artist input with typewriter placeholder — hero position */}
              <div className="relative">
                <Input
                  value={favoriteArtist}
                  onChange={(e) => setFavoriteArtist(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (favoriteArtist.trim() || selectedGenre)) {
                      void handleInterviewSubmit(false);
                    }
                  }}
                  className="text-base"
                  aria-label="An artist they love"
                />
                {/* Artist typewriter overlay — raw div, intentional pointer-events-none */}
                {!favoriteArtist && artistTypewriterText && (
                  <div
                    className="text-muted/50 pointer-events-none absolute inset-0 flex items-center overflow-hidden px-4 text-base"
                    aria-hidden="true"
                  >
                    {artistTypewriterText}
                    <span
                      className="ml-0.5 inline-block w-0.5 animate-pulse bg-current"
                      style={{ height: '1em', verticalAlign: 'middle' }}
                    />
                  </div>
                )}
              </div>
              {/* Genre chips — de-emphasized when artist is entered */}
              <div className={cn('flex flex-wrap gap-1.5', favoriteArtist && 'opacity-40')}>
                {/* Genre chip — rounded-pill custom shape, raw button per design-system exception */}
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
                    className={cn(
                      'border-border text-muted hover:border-accent hover:text-text min-h-11 rounded-full border px-3 py-1 text-xs transition-colors',
                      selectedGenre === genre && 'border-accent text-text bg-accent/10'
                    )}
                  >
                    {genre}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void handleInterviewSubmit(true)}
                  className="border-border text-muted hover:border-accent hover:text-text min-h-11 rounded-full border px-3 py-1 text-xs transition-colors"
                >
                  ✨ Surprise me
                </button>
              </div>
              <Button
                onClick={() => void handleInterviewSubmit(false)}
                className="w-full"
                disabled={!favoriteArtist.trim() && !selectedGenre}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Clarify — Claude-generated follow-up questions */}
          {step === 'clarify' && !botTyping && (
            <div className="space-y-3">
              {clarifyQuestions.map((question, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-muted text-xs font-medium">{question}</label>
                  <Input
                    value={clarifyAnswers[i] ?? ''}
                    onChange={(e) =>
                      setClarifyAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleClarifySubmit(false);
                    }}
                    className="text-base"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => handleClarifySubmit(true)}
                >
                  Generate anyway →
                </Button>
                <Button className="flex-1" onClick={() => handleClarifySubmit(false)}>
                  Let&apos;s go →
                </Button>
              </div>
            </div>
          )}

          {/* Generating state — fake progress bar while Claude writes the song */}
          {step === 'generating' && (
            <div className="space-y-2 py-3">
              <div className="bg-border overflow-hidden rounded-full" style={{ height: '4px' }}>
                <div
                  className="bg-accent h-full rounded-full"
                  style={{
                    width: `${genProgress}%`,
                    transition: genProgress === 0 ? 'none' : 'width 100000ms ease-in-out',
                  }}
                />
              </div>
              <p className="text-muted text-center text-sm">
                Writing {name ? `${name}'s` : 'their'} song...
              </p>
            </div>
          )}

          {/* Preview + Stripe CTA */}
          {step === 'preview' && preGenData && (
            <Button onClick={handlePayCTA} className="w-full" size="lg">
              Get {name ? `${name}'s` : 'the full'} song — $9.99 →
            </Button>
          )}

          {error && <p className="text-accent mt-2 text-center text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
