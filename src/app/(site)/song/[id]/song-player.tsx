'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

export default function SongPlayer({
  audioUrl,
  recipientName,
}: {
  audioUrl: string;
  recipientName: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
      analytics.songPlayed({ recipientName });
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  }

  function formatTime(s: number): string {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareText = `I made a personalized birthday song for ${recipientName} — check it out!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${recipientName}'s Birthday Song`, text: shareText, url });
        analytics.songShared();
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      analytics.songShared();
    }
  }, [recipientName]);

  return (
    <div className="border-border rounded-2xl border bg-white p-6">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />

      {/* Play/pause */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="bg-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow transition-opacity hover:opacity-90"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>

        {/* Scrubber */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div
            className="bg-border relative h-2 cursor-pointer rounded-full"
            onClick={handleSeek}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Song progress"
          >
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-muted flex justify-between text-xs">
            <span>{formatTime((progress / 100) * duration || 0)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Share + Download */}
      <div className="mt-5 flex justify-end gap-2">
        <a
          href={`${audioUrl}?download=`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border text-muted hover:border-accent inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          ↓ Download
        </a>
        <Button
          onClick={handleShare}
          variant="secondary"
          size="sm"
          className={cn(
            copied ? 'border-accent bg-accent/10 text-accent' : 'text-muted hover:border-accent'
          )}
        >
          {copied ? '✓ Link copied!' : 'Share this song →'}
        </Button>
      </div>
    </div>
  );
}
