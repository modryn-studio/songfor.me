import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/config/site';
import { FeedbackTrigger } from '@/components/feedback-trigger';

export function SiteFooter() {
  return (
    <footer className="border-border mt-24 border-t py-10">
      <div className="text-muted mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 text-sm sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label="Home"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <Image src="/brand/logomark.png" alt="" width={20} height={20} />
          </Link>
          <p>
            &copy; {new Date().getFullYear()} {site.name} &middot;{' '}
            <a
              href="https://modrynstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Modryn Studio
            </a>
          </p>
        </div>
        <nav className="flex items-center gap-5">
          <a
            href={site.social.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
            aria-label="X / Twitter"
          >
            X
          </a>
          <FeedbackTrigger />
          <Link href="/privacy" className="hover:text-accent transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-accent transition-colors">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
