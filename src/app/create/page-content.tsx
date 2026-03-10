'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { analytics } from '@/lib/analytics';
import type { VibeType } from '@/lib/types';

type StepId =
  | 'name'
  | 'age'
  | 'relationship'
  | 'quirks'
  | 'vibe'
  | 'genre'
  | 'email'
  | 'generating';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface IntakeState {
  name: string;
  age: string;
  relationship: string;
  quirk1: string;
  quirk2: string;
  quirk3: string;
  vibe: VibeType;
  genre: string;
  email: string;
}

const RELATIONSHIP_OPTIONS = [
  'Friend',
  'Partner',
  'Parent',
  'Sibling',
  'Child',
  'Coworker',
  'Other',
];

const VIBE_OPTIONS = [
  { value: 'heartfelt' as VibeType, label: 'Heartfelt', emoji: '🥺', desc: 'touching, genuine' },
  { value: 'hype' as VibeType, label: 'Hype', emoji: '🎉', desc: "party energy, let's go" },
  { value: 'roast' as VibeType, label: 'Roast', emoji: '🔥', desc: 'lovingly, of course' },
  { value: 'kids' as VibeType, label: 'Kids Bop', emoji: '🎈', desc: 'for little ones' },
];

const GENRE_OPTIONS = ['Pop', 'Country', 'Hip-Hop', 'Folk', 'R&B', 'Rock', 'Surprise me'];

const STEP_ORDER: StepId[] = ['name', 'age', 'relationship', 'quirks', 'vibe', 'genre', 'email'];

function getBotQuestion(step: StepId, name: string): string {
  switch (step) {
    case 'name':
      return "Let's make them a birthday song. Who is it for?";
    case 'age':
      return `How old is ${name} turning?`;
    case 'relationship':
      return `What's your relationship with ${name}?`;
    case 'quirks':
      return `Tell me 3 things that are SO ${name}. The more specific, the better — an inside joke, something they always say, a memory only you'd know.`;
    case 'vibe':
      return `What vibe should ${name}'s song have?`;
    case 'genre':
      return `What genre feels like ${name}?`;
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
  const [quirk1, setQuirk1] = useState('');
  const [quirk2, setQuirk2] = useState('');
  const [quirk3, setQuirk3] = useState('');
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    analytics.intakeStarted();
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
    setTimeout(() => pushMessage({ role: 'bot', text: getBotQuestion('age', name) }), 400);
    setStep('age');
    setTextInput('');
    setError('');
    analytics.intakeStep({ step: 'name' });
  }

  function handleAgeSubmit() {
    const age = textInput.trim();
    if (!age) {
      setError('Enter their age to continue.');
      return;
    }
    setAnswers((p) => ({ ...p, age }));
    advance('relationship', age);
    analytics.intakeStep({ step: 'age' });
  }

  function handleRelationshipSelect(rel: string) {
    setAnswers((p) => ({ ...p, relationship: rel }));
    pushMessage({ role: 'user', text: rel });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('quirks', answers.name ?? '') }),
      400
    );
    setStep('quirks');
    setError('');
    analytics.intakeStep({ step: 'relationship' });
  }

  function handleQuirksSubmit() {
    const q1 = quirk1.trim();
    if (!q1) {
      setError("Add at least one thing that's so them.");
      return;
    }
    const parts = [q1, quirk2.trim(), quirk3.trim()].filter(Boolean);
    setAnswers((p) => ({
      ...p,
      quirk1: q1,
      quirk2: quirk2.trim(),
      quirk3: quirk3.trim(),
    }));
    pushMessage({ role: 'user', text: parts.join(' · ') });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('vibe', answers.name ?? '') }),
      400
    );
    setStep('vibe');
    setError('');
    analytics.intakeStep({ step: 'quirks' });
  }

  function handleVibeSelect(vibe: VibeType) {
    const label = VIBE_OPTIONS.find((v) => v.value === vibe)?.label ?? vibe;
    setAnswers((p) => ({ ...p, vibe }));
    pushMessage({ role: 'user', text: label });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('genre', answers.name ?? '') }),
      400
    );
    setStep('genre');
    setError('');
    analytics.intakeStep({ step: 'vibe' });
  }

  function handleGenreSelect(genre: string) {
    setAnswers((p) => ({ ...p, genre }));
    pushMessage({ role: 'user', text: genre });
    setTimeout(
      () => pushMessage({ role: 'bot', text: getBotQuestion('email', answers.name ?? '') }),
      400
    );
    setStep('email');
    setError('');
    analytics.intakeStep({ step: 'genre' });
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
          age: finalAnswers.age,
          relationship: finalAnswers.relationship,
          quirk1: finalAnswers.quirk1,
          quirk2: finalAnswers.quirk2,
          quirk3: finalAnswers.quirk3,
          vibe: finalAnswers.vibe,
          genre: finalAnswers.genre,
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
      {/* Progress bar */}
      <div className="mb-6">
        <div className="bg-border h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
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
      <div className="border-border bg-bg fixed right-0 bottom-0 left-0 border-t p-4">
        <div className="mx-auto max-w-2xl">
          {(step === 'name' || step === 'age') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                step === 'name' ? handleNameSubmit() : handleAgeSubmit();
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                type="text"
                inputMode={step === 'age' ? 'numeric' : 'text'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={step === 'name' ? 'Their name...' : 'Their age...'}
                className="border-border bg-surface focus:border-accent flex-1 rounded-full border px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-accent rounded-full px-5 py-3 text-sm font-semibold text-white"
              >
                Next →
              </button>
            </form>
          )}

          {step === 'relationship' && (
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <button
                  key={rel}
                  onClick={() => handleRelationshipSelect(rel)}
                  className="border-border bg-surface hover:border-accent rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  {rel}
                </button>
              ))}
            </div>
          )}

          {step === 'quirks' && (
            <div className="space-y-2">
              <input
                autoFocus
                value={quirk1}
                onChange={(e) => setQuirk1(e.target.value)}
                placeholder="Something they always say, a nickname, an obsession..."
                className="border-border bg-surface focus:border-accent w-full rounded-xl border px-4 py-3 text-sm outline-none"
              />
              <input
                value={quirk2}
                onChange={(e) => setQuirk2(e.target.value)}
                placeholder="An inside joke, a memory, a hobby..."
                className="border-border bg-surface focus:border-accent w-full rounded-xl border px-4 py-3 text-sm outline-none"
              />
              <input
                value={quirk3}
                onChange={(e) => setQuirk3(e.target.value)}
                placeholder="One more thing that's so them..."
                className="border-border bg-surface focus:border-accent w-full rounded-xl border px-4 py-3 text-sm outline-none"
              />
              <button
                onClick={handleQuirksSubmit}
                className="bg-accent w-full rounded-full py-3 text-sm font-semibold text-white"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 'vibe' && (
            <div className="grid grid-cols-2 gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => handleVibeSelect(v.value)}
                  className="border-border bg-surface hover:border-accent flex flex-col items-start rounded-xl border p-3 text-left transition-colors"
                >
                  <span className="text-xl">{v.emoji}</span>
                  <span className="mt-1 text-sm font-semibold">{v.label}</span>
                  <span className="text-muted text-xs">{v.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'genre' && (
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenreSelect(g)}
                  className="border-border bg-surface hover:border-accent rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  {g}
                </button>
              ))}
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
              <input
                autoFocus
                type="email"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="your@email.com"
                className="border-border bg-surface focus:border-accent flex-1 rounded-full border px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-accent rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap text-white"
              >
                Generate for $9.99 →
              </button>
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
