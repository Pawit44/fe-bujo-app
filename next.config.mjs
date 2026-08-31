import withPWAInit from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const API = process.env.BUJO_API_URL || 'http://localhost:8080';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The browser always talks to /api/* on the Next server, which proxies to Gin.
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
};

// The upstream `next-pwa` package hasn't been published since 2022 and
// doesn't work against the App Router on modern Next.js; this is the
// actively maintained fork with the same withPWA(config) shape.
const withPWA = withPWAInit({
  dest: 'public',
  // Never register a service worker in dev — a stale cached bundle from a
  // previous run surviving a hot reload is a worse experience than no
  // offline support while iterating.
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // A page that hasn't been visited yet still needs the network on first
  // load; only /api/* is worth an explicit runtime-caching strategy, and
  // that's user data that must never be served stale, so nothing here is
  // configured to intercept it — the defaults precache the built assets
  // (JS/CSS/fonts/icons) and let everything else pass through untouched.
  workboxOptions: {
    skipWaiting: true,
  },
});

export default withPWA(nextConfig);
