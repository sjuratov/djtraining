import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: configDir,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101'}/api/:path*` },
    ];
  },
};

export default nextConfig;
