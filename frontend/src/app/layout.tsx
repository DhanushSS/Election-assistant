import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/hooks/useAuth';

export const metadata: Metadata = {
  title: {
    default: 'Election Assistant — Powered by Google Vertex AI',
    template: '%s | Election Assistant',
  },
  description:
    'Understand the election process, timelines, and steps with an AI-powered civic assistant. Get answers about voter registration, deadlines, and polling information.',
  keywords: [
    'election', 'voting', 'voter registration', 'election assistant',
    'civic', 'AI', 'Google Vertex AI',
  ],
  authors: [{ name: 'Election Assistant Team' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Election Assistant — Know Your Vote',
    description: 'AI-powered guidance for every step of the election process.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Election Assistant',
    description: 'AI-powered civic guidance powered by Google Vertex AI.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d1f3c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        {/* Critical security headers are set in next.config.js */}
      </head>
      <body>
        {/* Skip navigation — WCAG 2.4.1 */}
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
