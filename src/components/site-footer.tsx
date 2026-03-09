import { site } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="border-border mt-24 border-t py-10">
      <div className="text-muted mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 text-sm sm:flex-row sm:justify-between">
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
          <a href="/privacy" className="hover:text-accent transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-accent transition-colors">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
