/** @type {import('next').NextConfig} */
const API = process.env.BUJO_API_URL || 'http://localhost:8080';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The browser always talks to /api/* on the Next server, which proxies to Gin.
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
};

export default nextConfig;
