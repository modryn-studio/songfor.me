'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { analytics } from '@/lib/analytics';
import type { VibeType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type StepId =
  | 'name'
  | 'nickname'
  | 'age'
  | 'innerCircle'
  | 'details'
  | 'vibe'
  | 'music'
  | 'email'
  | 'generating';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface IntakeState {
  name: string;
  nickname: string;
  age: string;
  innerCircle: string;
  insideJoke: string;
  recentContext: string;
  personalityTrait: string;
  vibe: VibeType;
  musicReference: string;
  email: string;
}

// ── Quality scoring ─────────────────────────────────────────────────────────

function calcQualityScore({
  nickname,
  innerCircle,
  insideJoke,
  recentContext,
  personalityTrait,
  musicReference,
}: {
  nickname: string;
  innerCircle: string;
  insideJoke: string;
  recentContext: string;
  personalityTrait: string;
  musicReference: string;
}): number {
  let score = 0;

  if (nickname) score += 8;

  if (innerCircle) {
    score += 15;
    if (innerCircle.length > 50) score += 5;
    if (innerCircle.length > 100) score += 5;
  }

  if (insideJoke) {
    score += 20;
    if (insideJoke.length > 30) score += 5;
    if (insideJoke.length > 80) score += 5;
  }

  if (recentContext) {
    score += 12;
    if (recentContext.length > 50) score += 3;
  }

  if (personalityTrait) score += 8;
  if (musicReference) score += 15;

  return Math.min(score, 100);
}

function QualityRing({ score }: { score: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#ff6b6b';
  const label =
    score >= 70
      ? 'This already feels personal'
      : score >= 40
        ? 'Great start - add one more detail'
        : 'A few more details will make this hit';

  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
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

const VIBE_OPTIONS = [
  { value: 'heartfelt' as VibeType, label: 'Heartfelt', emoji: '🥺', desc: 'touching, genuine' },
  { value: 'hype' as VibeType, label: 'Hype', emoji: '🎉', desc: "party energy, let's go" },
  { value: 'roast' as VibeType, label: 'Roast', emoji: '🔥', desc: 'lovingly, of course' },
  { value: 'kids' as VibeType, label: 'Kids Bop', emoji: '🎈', desc: 'for little ones' },
];

const STEP_ORDER: StepId[] = [
  'name',
  'nickname',
  'age',
  'innerCircle',
  'details',
  'vibe',
  'music',
  'email',
];

function getBotQuestion(step: StepId, name: string): string {
  switch (step) {
    case 'name':
      return "Let's make them a birthday song. Who is it for?";
    case 'nickname':
      return `Does ${name} have a nickname? If so, drop it here — it might end up in the chorus.`;
    case 'age':
      return `How old is ${name} turning?`;
    case 'innerCircle':
      return `Who are you to ${name}, and who else should we name-drop? List your relationship, plus their partner, kids, friends, pets — anyone important.`;
    case 'details':
      return `What's the plan for ${name}'s birthday — and what makes them them?`;
    case 'vibe':
      return `What vibe should ${name}'s song have?`;
    case 'music':
      return `What should ${name}'s song sound like?`;
    case 'email':
      return `Last thing — where should we send the song when it's ready?`;
    default:
      return '';
  }
}

export default function CreateContent() {
  const [step, setStep] = useState<StepId>('name');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Let's make them a birthday song. Who is it for?" },
  ]);
  const [answers, setAnswers] = useState<Partial<IntakeState>>({});
  const [textInput, setTextInput] = useState('');
  const [detail1, setDetail1] = useState('');
  const [detail2, setDetail2] = useState('');
  const [detail3, setDetail3] = useState('');
  const [musicInput, setMusicInput] = useState('');
  const [nicknameSkipAttempted, setNicknameSkipAttempted] = useState(false);
  const [error, setError] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const qualityScore = calcQualityScore({
    nickname: answers.nickname ?? '',
    innerCircle: answers.innerCircle ?? '',
    insideJoke: detail1,
    recentContext: detail2,
    personalityTrait: detail3,
    musicReference: musicInput,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    analytics.intakeStarted();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const updateKeyboardOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      // Ignore small browser chrome shifts that are not the keyboard.
      setKeyboardOffset(offset > 120 ? offset : 0);
    };

    updateKeyboardOffset();
    viewport.addEventListener('resize', updateKeyboardOffset);
    viewport.addEventListener('scroll', updateKeyboardOffset);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardOffset);
      viewport.removeEventListener('scroll', updateKeyboardOffset);
    };
  }, []);

  function pushMessage(msg: Message) {
    setMessages((prev) => [...prev, msg]);
  }

  function advance(nextStep: StepId, userAnswer: string) {
    pushMessage({ role: 'user', text: userAnswer });
    const name = answers.name ?? '';
    setTimeout(() => pushMessage({ role: 'bot', text: getBotQuestion(nextStep, name) }), 400);
    setStep(nextStep);
    setTextInput('');
    setError('');
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleNameSubmit() {
    const name = textInput.trim();
    if (!name) {
      setError('Enter their name to continue.');
      return;
    }
    setAnswers((p) => ({ ...p, name }));
    pushMessage({ role: 'user', text: name });
    setTimeout(() => pushMessage({ role: 'bot', text: getBotQuestion('nickname', name) }), 400);
    setStep('nickname');
    setTextInput('');
    setError('');
    analytics.intakeStep({ step: 'name' });
  }

  function handleNicknameSubmit(skip = false) {
    const nickname = skip ? '' : textInput.trim();
    if (!skip && !nickname) {
      setError('Type a nickname or hit Skip.');
      return;
    }
    if (skip && !nicknameSkipAttempted) {
      setNicknameSkipAttempted(true);
      setError('');
      return;
    }
    setAnswers((p) => ({ ...p, nickname }));
    advance('age', skip ? '(no nickname)' : nickname);
    analytics.intakeStep({ step: 'nickname' });
  }

  function handleAgeSubmit() {
    const age = textInput.trim();
    if (!age) {
      setError('Enter their age to continue.');
      return;
    }
    setAnswers((p) => ({ ...p, age }));
    advance('innerCircle', age);
    analytics.intakeStep({ step: 'age' });
  }

  function handleInnerCircleSubmit() {
    const innerCircle = textInput.trim();
    if (!innerCircle) {
      setError('List at least one person or pet — this is what makes the song personal.');
      return;
    }
    setAnswers((p) => ({ ...p, innerCircle }));
    pushMessage({ role: 'user', text: innerCircle });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('details', answers.name ?? '') }),
      400
    );
    setStep('details');
    setTextInput('');
    setError('');
    analytics.intakeStep({ step: 'innerCircle' });
  }

  function handleDetailsSubmit() {
    const d1 = detail1.trim();
    if (!d1) {
      setError('Give us at least one detail — this is what makes the song hit.');
      return;
    }
    const parts = [d1, detail2.trim(), detail3.trim()].filter(Boolean);
    setAnswers((p) => ({
      ...p,
      insideJoke: d1,
      recentContext: detail2.trim(),
      personalityTrait: detail3.trim(),
    }));
    pushMessage({ role: 'user', text: parts.join(' · ') });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('vibe', answers.name ?? '') }),
      400
    );
    setStep('vibe');
    setError('');
    analytics.intakeStep({ step: 'details' });
  }

  function handleVibeSelect(vibe: VibeType) {
    const label = VIBE_OPTIONS.find((v) => v.value === vibe)?.label ?? vibe;
    setAnswers((p) => ({ ...p, vibe }));
    pushMessage({ role: 'user', text: label });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('music', answers.name ?? '') }),
      400
    );
    setStep('music');
    setError('');
    analytics.intakeStep({ step: 'vibe' });
  }

  function handleMusicSubmit() {
    const music = musicInput.trim();
    if (!music) {
      setError('Give us something to work with — an artist, song, or genre.');
      return;
    }
    setAnswers((p) => ({ ...p, musicReference: music }));
    pushMessage({ role: 'user', text: music });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('email', answers.name ?? '') }),
      400
    );
    setStep('email');
    setError('');
    analytics.intakeStep({ step: 'music' });
  }

  async function handleEmailSubmit() {
    const email = textInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    const finalAnswers = { ...answers, email } as IntakeState;
    setAnswers(finalAnswers);
    pushMessage({ role: 'user', text: email });
    setTimeout(
      () =>
        pushMessage({
          role: 'bot',
          text: `Writing ${finalAnswers.name}'s song now — this takes about 15 seconds...`,
        }),
      400
    );
    setStep('generating');
    analytics.intakeCompleted({ name: finalAnswers.name });

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: finalAnswers.name,
          nickname: finalAnswers.nickname,
          age: finalAnswers.age,
          innerCircle: finalAnswers.innerCircle,
          insideJoke: finalAnswers.insideJoke,
          recentContext: finalAnswers.recentContext,
          personalityTrait: finalAnswers.personalityTrait,
          vibe: finalAnswers.vibe,
          musicReference: finalAnswers.musicReference,
          email: finalAnswers.email,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const { stripeUrl } = (await res.json()) as { stripeUrl: string };
      window.location.href = stripeUrl;
    } catch {
      setStep('email');
      setTextInput(email);
      setError(`Something went sideways. Try again — ${finalAnswers.name} is worth it.`);
    }
  }

  const name = answers.name ?? '';
  const stepIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const progress = stepIndex < 0 ? 100 : (stepIndex / STEP_ORDER.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-56">
      {/* Header: progress bar + quality ring */}
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-accent h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {step !== 'name' && step !== 'generating' && <QualityRing score={qualityScore} />}
      </div>

      {/* Chat messages */}
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm md:text-base',
                msg.role === 'bot'
                  ? 'border-border bg-surface text-text rounded-tl-sm border'
                  : 'bg-accent rounded-tr-sm text-white'
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — fixed to bottom */}
      <div
        className="border-border bg-bg/95 fixed right-0 left-0 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm"
        style={{ bottom: keyboardOffset }}
      >
        <div className="mx-auto max-w-2xl">
          {(step === 'name' || step === 'age' || step === 'innerCircle') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 'name') handleNameSubmit();
                else if (step === 'age') handleAgeSubmit();
                else handleInnerCircleSubmit();
              }}
              className="flex gap-2"
            >
              <Input
                autoFocus
                type="text"
                inputMode={step === 'age' ? 'numeric' : 'text'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  step === 'name'
                    ? 'Their name...'
                    : step === 'age'
                      ? 'Their age...'
                      : "e.g. I'm their mom. Partner: Jake. Kids: Lily, Dylan. Dog: Biscuit."
                }
                className="flex-1"
              />
              <Button type="submit">Next →</Button>
            </form>
          )}

          {step === 'nickname' && (
            <div className="flex flex-wrap gap-2">
              <Input
                autoFocus
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  nicknameSkipAttempted
                    ? 'Really? Not even a silly one? Nicknames make the chorus hit different.'
                    : 'Their nickname...'
                }
                className="min-w-0 flex-1 basis-full sm:basis-auto"
              />
              <Button onClick={() => handleNicknameSubmit()}>Next →</Button>
              <Button onClick={() => handleNicknameSubmit(true)} variant="secondary">
                {nicknameSkipAttempted ? 'Skip anyway' : 'Skip'}
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-2">
              <label className="text-muted block text-xs font-semibold tracking-wide uppercase">
                Inside joke or crew phrase
              </label>
              <Input
                autoFocus
                value={detail1}
                onChange={(e) => setDetail1(e.target.value)}
                placeholder={`e.g. "we're not in a hurry" — something only ${name}'s people would get`}
                className="rounded-2xl"
              />
              <label className="text-muted mt-3 block text-xs font-semibold tracking-wide uppercase">
                Birthday plan or recent life moment
              </label>
              <Textarea
                value={detail2}
                onChange={(e) => setDetail2(e.target.value)}
                placeholder={`e.g. trampoline sleepover, escape room, cookout in the backyard — or baby on the way, just got promoted...`}
                rows={2}
              />
              <label className="text-muted mt-3 block text-xs font-semibold tracking-wide uppercase">
                Their signature energy
              </label>
              <Input
                value={detail3}
                onChange={(e) => setDetail3(e.target.value)}
                placeholder={`e.g. makes everyone feel like the most important person in the room`}
                className="rounded-2xl"
              />
              <Button onClick={handleDetailsSubmit} className="w-full">
                Continue →
              </Button>
            </div>
          )}

          {step === 'vibe' && (
            <div className="grid grid-cols-2 gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => handleVibeSelect(v.value)}
                  className="border-border bg-surface hover:border-accent flex flex-col items-start rounded-2xl border p-3 text-left transition-colors"
                >
                  <span className="text-xl">{v.emoji}</span>
                  <span className="mt-1 text-sm font-semibold">{v.label}</span>
                  <span className="text-muted text-xs">{v.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'music' && (
            <div className="space-y-2">
              <Input
                autoFocus
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
                placeholder="e.g. Taylor Swift, Drake, Morgan Wallen"
                className="rounded-2xl"
              />
              {qualityScore < 40 && (
                <p className="text-muted text-center text-xs">
                  One more detail above will make this feel unmistakably like them.
                </p>
              )}
              <Button onClick={handleMusicSubmit} disabled={qualityScore < 40} className="w-full">
                Continue →
              </Button>
            </div>
          )}

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
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="your@email.com"
                className="flex-1"
              />
              <Button type="submit" className="whitespace-nowrap">
                Generate for $9.99 →
              </Button>
            </form>
          )}

          {step === 'generating' && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full" />
              <span className="text-muted ml-2 text-sm">Writing {name}&apos;s song...</span>
            </div>
          )}

          {error && <p className="text-accent mt-2 text-center text-sm">{error}</p>}
        </div>
      </div>
    </main>
  );
}
