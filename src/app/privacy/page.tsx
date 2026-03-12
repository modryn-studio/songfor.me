import type { Metadata } from 'next';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: `Privacy Policy — ${site.name} Birthday Song Generator`,
  description:
    'How songfor.me handles your data. We only use your personal information to create and deliver your personalized birthday song.',
};

export default function PrivacyPage() {
  const effectiveDate = 'March 9, 2026';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading mb-2 text-3xl font-semibold sm:text-4xl">Privacy Policy</h1>
      <p className="text-muted mb-10 text-sm">Effective {effectiveDate}</p>

      <div className="text-text space-y-8 text-[15px] leading-relaxed sm:text-base">
        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">What we collect</h2>
          <p>
            When you order a song, we collect your email address, the recipient&apos;s name, and the
            personal details you share during intake (for example: nickname, age, people to mention,
            inside jokes, vibe, and music references). We use this information only to create your
            song and deliver it to you.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">How we use it</h2>
          <p>
            Your intake data is used to generate song lyrics via the Claude AI API (Anthropic) and
            to produce music on Suno. We do not sell your data. We do not share it with third
            parties except as required to operate the service (Anthropic, Suno, Stripe for payment
            processing, Resend for email delivery).
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Email</h2>
          <p>
            We send one transactional email when your song is ready. If you signed up for the
            waitlist, you may receive occasional product updates. You can unsubscribe at any time by
            replying to any email.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Song pages</h2>
          <p>
            Shareable song pages (<code>/song/[id]</code>) are public by default so you can send
            them to the recipient. They contain the song audio and lyrics. If you&apos;d like a page
            removed, email us and we&apos;ll take it down within 24 hours.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Cookies &amp; analytics</h2>
          <p>
            We use Vercel Analytics for anonymous pageview tracking. No personally identifiable
            information is stored in analytics. We use no advertising cookies or third-party
            tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Contact</h2>
          <p>
            Questions? Email{' '}
            <a href="mailto:hello@songfor.gift" className="text-accent hover:underline">
              hello@songfor.gift
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
