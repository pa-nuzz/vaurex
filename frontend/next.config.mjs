/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    proxyClientMaxBodySize: 25 * 1024 * 1024,
  },
  images: {
    unoptimized: true,
  },
  // Allow all localhost/127.0.0.1 origins in dev (VS Code browser, previews)
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "192.168.1.66",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
