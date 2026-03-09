import EmailSignup from '@/components/email-signup';

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Make them a birthday song they&apos;ll never forget.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Tell us about them. We&apos;ll write the lyrics, compose the music, and
          deliver a one-of-a-kind song in minutes.
        </p>
        <div className="mt-10">
          <a
            href="/create"
            className="inline-block rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          >
            Start their song &rarr;
          </a>
        </div>
        <p className="mt-4 text-sm text-muted">$9.99 &middot; delivered in ~15 minutes</p>
      </section>

      <EmailSignup />
    </main>
  );
}