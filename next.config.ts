import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Standalone domain — no basePath needed.
  // songfor.me is deployed at the root, not under /tools/.
  async rewrites() {
    return {
      // PostHog reverse proxy — routes analytics through the same domain to
      // avoid ad-blocker interference. Works in local dev and production.
      beforeFiles: [
        {
          source: '/ingest/static/:path*',
          destination: 'https://us-assets.i.posthog.com/static/:path*',
        },
        {
          source: '/ingest/:path*',
          destination: 'https://us.i.posthog.com/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
