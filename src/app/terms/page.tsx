import type { Metadata } from 'next';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: `Terms of Service — ${site.name} Birthday Song Generator`,
  description:
    'Terms for using songfor.me. $9.99 per song, delivered to your email in ~15 minutes. Read our usage rules, refund policy, and licensing terms.',
};

export default function TermsPage() {
  const effectiveDate = 'March 9, 2026';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading mb-2 text-3xl font-semibold sm:text-4xl">Terms of Service</h1>
      <p className="text-muted mb-10 text-sm">Effective {effectiveDate}</p>

      <div className="text-text space-y-8 text-[15px] leading-relaxed sm:text-base">
        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">The service</h2>
          <p>
            {site.name} generates personalized birthday songs based on details you provide. You pay
            $9.99 per song. When ordering is open, songs are delivered to your email after payment.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Payment</h2>
          <p>
            All payments are processed securely through Stripe. By purchasing, you authorize a
            one-time charge of $9.99. All sales are final — we do not offer refunds unless the song
            is not delivered within 1 hour of payment.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Your content</h2>
          <p>
            You are responsible for ensuring that any personal information you share about others
            (the recipient) is done with appropriate care. Do not submit content that is defamatory,
            harassing, or violates any applicable law.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">The songs</h2>
          <p>
            Songs are generated using AI tools (Claude for lyrics, Suno for music). We grant you a
            personal, non-commercial license to use and share the song for the birthday occasion.
            You may not resell or commercially distribute the songs.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Delivery</h2>
          <p>
            Delivery timing can vary during high demand or unexpected issues. If your song is not
            delivered within 1 hour of payment, contact us and we will make it right.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Limitation of liability</h2>
          <p>
            The service is provided &quot;as is.&quot; We are not liable for any indirect or
            consequential damages arising from use of the service.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-xl font-semibold">Contact</h2>
          <p>
            Questions?{' '}
            <a href="mailto:hello@songfor.gift" className="text-accent hover:underline">
              hello@songfor.gift
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
