'use client';

import { useEffect, useRef } from 'react';

interface Piece {
  x: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FF6B6B', '#FFD93D', '#FF6B6B', '#FFFAF5', '#FFD93D'];
    const pieces: Piece[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      vy: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
    }));

    let animId: number;
    let y = -20;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      y += 0.5;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.05; // gravity
        p.rotation += p.rotationSpeed;
        (p as { _y?: number })._y = ((p as { _y?: number })._y ?? y) + p.vy;

        ctx.save();
        ctx.translate(p.x, (p as { _y?: number })._y!);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (pieces.some((p) => (p as { _y?: number })._y! < canvas.height + 20)) {
        animId = requestAnimationFrame(draw);
      }
    }

    animId = requestAnimationFrame(draw);
    const timeout = setTimeout(() => cancelAnimationFrame(animId), 4000);
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" aria-hidden="true" />
  );
}

export default function ConfirmedContent({ email, name }: { email: string; name: string }) {
  useEffect(() => {
    // Payment confirmed — clear the intake draft so the next song starts fresh
    localStorage.removeItem('songforme_draft');
  }, []);

  return (
    <>
      <Confetti />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg">
          <div className="mb-6 text-5xl">🎵</div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {name}&apos;s song is being crafted.
          </h1>
          <p className="text-muted mx-auto mt-4 max-w-sm text-base">
            We&apos;ll send it to <span className="text-text font-medium">{email}</span> as soon as
            it&apos;s ready — usually within a few hours.
          </p>

          {/* Pulse indicator */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-accent relative inline-flex h-3 w-3 rounded-full" />
            </span>
            <span className="text-muted text-sm">Song composing · Almost there</span>
          </div>

          <p className="text-muted mt-16 text-xs">
            Check your spam folder if it doesn&apos;t arrive. Still nothing? Hit the feedback button
            and we&apos;ll sort it.
          </p>
        </div>
      </main>
    </>
  );
}
