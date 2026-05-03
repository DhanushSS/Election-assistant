/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for React (catches lifecycle bugs)
  reactStrictMode: true,

  // Output as standalone for Docker/Cloud Run
  output: 'standalone',

  // Security headers (OWASP A05 — Security Misconfiguration)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
              "font-src 'self' https://api.fontshare.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            // OWASP A02 — Cryptographic Failures
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },

  // External packages that must run in Node.js (not bundled for browser)
  // In Next.js 14 this lives under `experimental`
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin',
      '@google-cloud/vertexai',
      '@google-cloud/translate',
    ],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },

  // Webpack — suppress server-side Node.js module warnings in browser bundle
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
