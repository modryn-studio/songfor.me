import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Standalone domain — no basePath needed.
  // songfor.me is deployed at the root, not under /tools/.
};

export default nextConfig;
