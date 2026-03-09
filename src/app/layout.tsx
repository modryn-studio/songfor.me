import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { site } from '@/config/site';
import { SiteSchema } from '@/components/site-schema';
import { SiteFooter } from '@/components/site-footer';
import FeedbackWidget from '@/components/feedback-widget';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#FF6B6B',
};

export const metadata: Metadata = {
  title: site.ogTitle,
  description: site.description,
  metadataBase: new URL(site.url),
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: site.ogTitle,
    description: site.ogDescription,
    url: site.url,
    siteName: site.name,
    type: 'website',
    // opengraph-image.tsx in app/ handles dynamic OG image generation via next/og
  },
  twitter: {
    card: 'summary_large_image',
    site: site.social.twitterHandle,
    title: site.ogTitle,
    description: site.ogDescription,
    creator: site.social.twitterHandle,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SiteSchema />
        {children}
        <SiteFooter />
        <Analytics />
        <FeedbackWidget />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
