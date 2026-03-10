import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { site } from '@/config/site';
import type { Song } from '@/lib/types';
import SongPlayer from './song-player';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = supabaseAdmin();
  const { data: song } = await db
    .from('songs')
    .select('recipient_name')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!song) return { title: site.name };

  return {
    title: `${song.recipient_name}'s Birthday Song — ${site.name}`,
    description: `A personalized birthday song made just for ${song.recipient_name}. Listen now.`,
    openGraph: {
      title: `${song.recipient_name}'s Birthday Song 🎵`,
      description: `A personalized birthday song made just for ${song.recipient_name}. Listen now.`,
      url: `${site.url}/song/${id}`,
      siteName: site.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${song.recipient_name}'s Birthday Song 🎵`,
      description: `A personalized birthday song made just for ${song.recipient_name}.`,
    },
  };
}

function parseLyrics(lyrics: string): Array<{ section: string; lines: string[] }> {
  const sections: Array<{ section: string; lines: string[] }> = [];
  let current: { section: string; lines: string[] } | null = null;

  for (const line of lyrics.split('\n')) {
    const match = line.match(/^\[(.+)\]$/);
    if (match) {
      if (current && current.lines.some((l) => l.trim())) sections.push(current);
      current = { section: match[1], lines: [] };
    } else if (current) {
      if (line.trim() || current.lines.length > 0) current.lines.push(line);
    }
  }
  if (current && current.lines.some((l) => l.trim())) sections.push(current);

  return sections;
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { data: song } = await db
    .from('songs')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single<Song>();

  if (!song) notFound();

  const sections = parseLyrics(song.lyrics);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-muted mb-2 text-sm font-medium tracking-widest uppercase">
          A birthday song for
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {song.recipient_name}
        </h1>
      </div>

      {/* Player */}
      {song.audio_url ? (
        <SongPlayer audioUrl={song.audio_url} recipientName={song.recipient_name} />
      ) : (
        <div className="border-border rounded-2xl border p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-accent relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            <p className="text-muted text-sm">Song is being crafted — check back soon. ✨</p>
          </div>
        </div>
      )}

      {/* Lyrics */}
      <section className="mt-12 space-y-8" aria-label="Song lyrics">
        {sections.map((s, i) => (
          <div key={i}>
            <p className="text-muted mb-2 text-xs font-semibold tracking-widest uppercase">
              {s.section}
            </p>
            <div className="space-y-1">
              {s.lines.map((line, j) => (
                <p key={j} className={line.trim() ? 'text-text text-base leading-relaxed' : 'h-2'}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Attribution */}
      <div className="border-border mt-14 border-t pt-8 text-center">
        <p className="text-muted text-sm">
          Made with{' '}
          <a href={site.url} className="text-accent hover:underline">
            {site.name}
          </a>{' '}
          · Give someone a birthday song they&apos;ll never forget.
        </p>
        <a
          href="/create"
          className="bg-accent mt-4 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Make one for someone →
        </a>
      </div>
    </main>
  );
}
