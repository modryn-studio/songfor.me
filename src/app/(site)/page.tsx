import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { PromoBanner } from '@/components/promo-banner';

export const metadata: Metadata = {
  title: site.ogTitle,
  description: site.description,
  openGraph: {
    title: site.ogTitle,
    description: site.ogDescription,
    url: site.url,
  },
};

export default function Home() {
  return (
    <>
      <PromoBanner />
      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Make them a birthday song they&apos;ll never forget.
          </h1>
          <p className="text-muted mx-auto mt-6 max-w-2xl text-lg">
            Tell us about them. We&apos;ll write the lyrics, compose the music, and deliver a
            one-of-a-kind song in minutes.
          </p>
          <div className="mt-10">
            <Link
              href="/create"
              className="bg-accent inline-block rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              Start their song &rarr;
            </Link>
          </div>
          <p className="text-muted mt-4 text-sm">
            One-of-a-kind &middot; delivered in minutes &middot; $9.99
          </p>
        </section>
      </main>
    </>
  );
}
