import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TranslationProvider } from '../features/translation/TranslationContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'VoteAI India — Your Guide to Indian Elections',
    template: '%s | VoteAI India',
  },
  description:
    'AI-powered guide to Indian elections — Lok Sabha, Rajya Sabha, state elections, voter registration, ECI processes, EVMs, and the democratic process. Powered by Google Vertex AI.',
  keywords: ['Indian elections', 'Lok Sabha', 'voter registration', 'ECI', 'EVM', 'VVPAT', 'Form 6'],
  openGraph: {
    title: 'VoteAI India',
    description: 'Your AI guide to Indian elections powered by Google Vertex AI',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }} className={inter.variable}>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* Skip navigation for accessibility */}
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <TranslationProvider>
          <main id="main-content">{children}</main>
        </TranslationProvider>
      </body>
    </html>
  );
}
