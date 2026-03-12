'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { analytics } from '@/lib/analytics';
import type { VibeType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type StepId = 'freeform' | 'vibe' | 'music' | 'email' | 'generating' | 'preview';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface IntakeAnswers {
  freeform: string;
  vibe: VibeType;
  musicReference: string;
  email: string;
}

interface PreviewData {
  orderId: string;
  stripeUrl: string;
  lyricsPreview: string;
}

// ── Placeholder examples (from real prompts) ─────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  "Monica is turning 12. Party with a trampoline, camping tent, and s'mores around the fire pit. She loves dancing and all her friends will be there...",
  'Nick is turning 37. His girlfriend Kathy calls him Slay Baddie Snickers. He loves jet skis and just got a new motorcycle. Small party with the kids in his cool basement...',
  "Paula is turning 34, pregnant with baby Alex. I'm her husband Luke. We have an 8 yr old Aria, a dog Snowbell, and four cats. She collects plants and Pokémon cards...",
];

// ── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(examples: readonly string[], active: boolean) {
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
          timer = setTimeout(tick, 2000); // pause at full text
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
  }, [active, examples]);

  return text;
}

// ── Quality scoring (freeform heuristics) ────────────────────────────────────

function calcQualityScore(text: string): number {
  if (!text.trim()) return 0;
  let score = 0;

  // Has a capitalized name-like word
  if (/\b[A-Z][a-z]{1,}\b/.test(text)) score += 15;

  // Has a number (age)
  if (/\b\d{1,3}\b/.test(text)) score += 10;

  // Mentions multiple names
  const nameMatches = text.match(/\b[A-Z][a-z]{2,}\b/g);
  if (nameMatches && new Set(nameMatches).size >= 3) score += 15;

  // Word count
  const words = text.trim().split(/\s+/).length;
  if (words > 20) score += 8;
  if (words > 40) score += 8;
  if (words > 60) score += 9;

  // Specific details (quotes, nicknames, inside jokes)
  if (/["'"].+["'"]|calls?\s+(them|him|her|me)|nickname|inside joke|always says/i.test(text))
    score += 15;

  // Relationship mention
  if (
    /\b(mom|dad|husband|wife|friend|sister|brother|son|daughter|partner|girlfriend|boyfriend)\b/i.test(
      text
    )
  )
    score += 10;

  // Activity / event mention
  if (/\b(party|birthday|celebration|dinner|trip|surprise|cake|gifts?|presents?)\b/i.test(text))
    score += 10;

  return Math.min(score, 100);
}

// ── Nudge chips ──────────────────────────────────────────────────────────────

function getNudgeChips(text: string): { label: string; append: string }[] {
  const chips: { label: string; append: string }[] = [];
  if (!/\b[A-Z][a-z]{1,}\b/.test(text)) {
    chips.push({ label: 'Their name?', append: 'Their name is ' });
  }
  if (!/\b\d{1,3}\b/.test(text)) {
    chips.push({ label: 'How old?', append: "They're turning " });
  }
  const names = text.match(/\b[A-Z][a-z]{2,}\b/g);
  if (!names || new Set(names).size < 2) {
    chips.push({ label: "Who'll be there?", append: 'The party will have ' });
  }
  if (!/nickname|called|calls|inside joke|always says|["'"]/i.test(text)) {
    chips.push({ label: 'Any nickname or joke?', append: 'Everyone calls them ' });
  }
  if (!/party|birthday|dinner|trip|celebration|doing|plan/i.test(text)) {
    chips.push({ label: 'Birthday plan?', append: 'For their birthday, ' });
  }
  return chips;
}

// ── Name / age extraction ────────────────────────────────────────────────────

function parseName(text: string): string {
  const patterns = [
    /(?:name is|named|for|called)\s+([A-Z][a-z]+)/i,
    /\b([A-Z][a-z]+)\s+is\s+turning\b/,
    /^([A-Z][a-z]+)\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '';
}

// ── Quality ring ─────────────────────────────────────────────────────────────

function QualityRing({ score }: { score: number }) {
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
    <div className="flex shrink-0 flex-col items-center gap-0.5" title={label}>
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

const VIBE_OPTIONS: { value: VibeType; label: string; emoji: string; desc: string }[] = [
  { value: 'heartfelt', label: 'Heartfelt', emoji: '🥺', desc: 'touching, genuine' },
  { value: 'hype', label: 'Hype', emoji: '🎉', desc: "party energy, let's go" },
  { value: 'roast', label: 'Roast', emoji: '🔥', desc: 'lovingly, of course' },
  { value: 'kids', label: 'Kids Bop', emoji: '🎈', desc: 'for little ones' },
  { value: 'surprise', label: 'Surprise me', emoji: '✨', desc: "you pick, we'll nail it" },
];

const GENRE_CHIPS = ['Pop', 'Hip-Hop', 'Country', 'R&B', 'Rock', 'Reggae', 'Surprise me'];

const STEP_ORDER: StepId[] = ['freeform', 'vibe', 'music', 'email'];

function getBotQuestion(step: StepId, name: string): string {
  const who = name || 'them';
  switch (step) {
    case 'freeform':
      return 'Tell us about them — their name, age, quirks, inside jokes. The more you share, the better the song.';
    case 'vibe':
      return `What vibe should ${who}'s song have?`;
    case 'music':
      return `What should ${who}'s song sound like?`;
    case 'email':
      return `Last thing — where should we send ${who}'s song when it's ready?`;
    default:
      return '';
  }
}

// ── Lyrics preview card ──────────────────────────────────────────────────────

function LyricsPreviewCard({ lyricsPreview, name }: { lyricsPreview: string; name: string }) {
  const lines = lyricsPreview
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const visibleLines = lines.slice(0, 4);
  const blurredLines = lines.slice(4, 8);

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
      <p className="text-muted mt-3 text-xs">Unlock the full song below →</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CreateContent() {
  const [step, setStep] = useState<StepId>('freeform');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: getBotQuestion('freeform', '') },
  ]);
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({});
  const [freeformText, setFreeformText] = useState('');
  const [musicInput, setMusicInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Typewriter — active only when textarea is empty and unfocused on step 1
  const [textareaFocused, setTextareaFocused] = useState(false);
  const showTypewriter = step === 'freeform' && !freeformText && !textareaFocused;
  const typewriterText = useTypewriter(PLACEHOLDER_EXAMPLES, showTypewriter);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const qualityScore = calcQualityScore(freeformText);
  const parsedName = parseName(freeformText);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    analytics.intakeStarted();
  }, []);

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
        break;
      case 'vibe':
        setAnswers((p) => {
          const n = { ...p };
          delete n.vibe;
          return n;
        });
        break;
      case 'music':
        setMusicInput(answers.musicReference ?? '');
        setAnswers((p) => {
          const n = { ...p };
          delete n.musicReference;
          return n;
        });
        break;
    }

    setStep(prevStep);
    setError('');
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleFreeformSubmit() {
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

    const name = parseName(text);
    setAnswers((p) => ({ ...p, freeform: text }));

    const preview = text.length > 120 ? text.slice(0, 120).replace(/\s+\S*$/, '') + '…' : text;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: preview },
      { role: 'bot', text: getBotQuestion('vibe', name) },
    ]);
    setStep('vibe');
    setError('');
    analytics.intakeStep({ step: 'freeform' });
  }

  function handleVibeSelect(vibe: VibeType) {
    const label = VIBE_OPTIONS.find((v) => v.value === vibe)?.label ?? vibe;
    setAnswers((p) => ({ ...p, vibe }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: label },
      { role: 'bot', text: getBotQuestion('music', parsedName) },
    ]);
    setStep('music');
    setError('');
    analytics.intakeStep({ step: 'vibe' });
  }

  function handleMusicSubmit() {
    const music = musicInput.trim();
    if (!music) {
      setError('Pick a genre or tell us an artist — anything helps.');
      return;
    }
    setAnswers((p) => ({ ...p, musicReference: music }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: music },
      { role: 'bot', text: getBotQuestion('email', parsedName) },
    ]);
    setStep('email');
    setError('');
    analytics.intakeStep({ step: 'music' });
  }

  async function handleEmailSubmit() {
    const email = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    const name = parsedName || 'Birthday Person';
    const text = freeformText.trim();

    setAnswers((p) => ({ ...p, email }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: email },
      { role: 'bot', text: `Making ${name}'s song personal — just a few seconds...` },
    ]);
    setStep('generating');
    analytics.intakeCompleted({ name });

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeformContext: text,
          parsedName: parsedName || '',
          vibe: answers.vibe,
          musicReference: answers.musicReference,
          email,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error;
        throw new Error(msg || 'API error');
      }

      const { orderId, stripeUrl, lyricsPreview } = (await res.json()) as {
        orderId: string;
        stripeUrl: string | null;
        lyricsPreview: string;
      };

      if (!stripeUrl) throw new Error('Payment link unavailable — please try again.');

      setPreviewData({ orderId, stripeUrl, lyricsPreview });
      pushMessage({
        role: 'bot',
        text: `Here's a taste of what we've got for ${name} ✨`,
      });
      setStep('preview');
    } catch (err) {
      setStep('email');
      const msg = err instanceof Error ? err.message : null;
      setError(msg || `Something went sideways. Try again — ${name} is worth it.`);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const name = parsedName || '';
  const stepIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const progress =
    step === 'generating' || step === 'preview' ? 100 : (stepIndex / STEP_ORDER.length) * 100;
  const showBack = stepIndex > 0 && step !== 'generating' && step !== 'preview';
  const showQuality = step === 'freeform' && freeformText.length > 0;

  const nudgeChips = step === 'freeform' && qualityScore < 70 ? getNudgeChips(freeformText) : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-border shrink-0 border-b px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <Image src="/brand/logomark.png" alt="songfor.me" width={24} height={24} />
          </Link>
          {showBack && (
            <button
              onClick={handleBack}
              className="text-muted hover:text-text shrink-0 text-sm transition-colors"
              aria-label="Go back one step"
            >
              ← Back
            </button>
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
          {showQuality && <QualityRing score={qualityScore} />}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
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

          {/* Lyrics preview card */}
          {step === 'preview' && previewData && (
            <LyricsPreviewCard lyricsPreview={previewData.lyricsPreview} name={name} />
          )}
        </div>
      </div>

      {/* ── Input panel ────────────────────────────────────────────────────── */}
      <div className="border-border bg-bg/95 shrink-0 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          {/* Step 1: Freeform dump */}
          {step === 'freeform' && (
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  autoFocus
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  onFocus={() => setTextareaFocused(true)}
                  onBlur={() => setTextareaFocused(false)}
                  rows={4}
                  className="text-base"
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

              {/* Nudge chips */}
              {nudgeChips.length > 0 && freeformText.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {nudgeChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleNudgeChip(chip.append)}
                      className="border-border text-muted hover:border-accent hover:text-text rounded-full border px-3 py-1 text-xs transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <Button onClick={handleFreeformSubmit} className="w-full">
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Vibe tiles */}
          {step === 'vibe' && (
            <div className="grid grid-cols-2 gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => handleVibeSelect(v.value)}
                  className={cn(
                    'border-border bg-surface hover:border-accent flex flex-col items-start rounded-2xl border p-3 text-left transition-colors',
                    v.value === 'surprise' && 'col-span-2'
                  )}
                >
                  <span className="text-xl">{v.emoji}</span>
                  <span className="mt-1 text-sm font-semibold">{v.label}</span>
                  <span className="text-muted text-xs">{v.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Genre chips + text input */}
          {step === 'music' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {GENRE_CHIPS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      if (genre === 'Surprise me') {
                        setMusicInput(genre);
                      } else {
                        setMusicInput((prev) => {
                          if (prev.includes(genre)) return prev;
                          return prev ? `${prev}, ${genre}` : genre;
                        });
                      }
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      musicInput.includes(genre)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:border-accent hover:text-text'
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <Input
                autoFocus
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMusicSubmit();
                }}
                placeholder="or type an artist — Taylor Swift, Drake, Morgan Wallen..."
                className="text-base"
              />
              <Button onClick={handleMusicSubmit} className="w-full">
                Continue →
              </Button>
            </div>
          )}

          {/* Step 4: Email */}
          {step === 'email' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailSubmit();
              }}
              className="flex gap-2"
            >
              <Input
                autoFocus
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 text-base"
              />
              <Button type="submit" className="whitespace-nowrap">
                Generate for $9.99 →
              </Button>
            </form>
          )}

          {/* Generating state */}
          {step === 'generating' && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full" />
              <span className="text-muted ml-2 text-sm">
                Writing {name || 'their'}&apos;s song...
              </span>
            </div>
          )}

          {/* Preview + Stripe CTA */}
          {step === 'preview' && previewData && (
            <Button
              onClick={() => {
                window.location.href = previewData.stripeUrl;
              }}
              className="w-full"
              size="lg"
            >
              Get the full song — $9.99 →
            </Button>
          )}

          {error && <p className="text-accent mt-2 text-center text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
