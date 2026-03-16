import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    proxyClientMaxBodySize: 25 * 1024 * 1024,
    turbopack: {
      root: __dirname,
    },
  },
  images: {
    unoptimized: true,
  },
  // Proxy /api/* → FastAPI backend (this is what was missing!)
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      "http://localhost:8000"
    ).replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.localhost",
    "192.168.1.66",
  ],
};

export default nextConfig;