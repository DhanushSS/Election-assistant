'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LiquidGlass } from '../ui/LiquidGlass';
import { useTranslationContext } from '../../features/translation/TranslationContext';

/**
 * Navbar — liquid glass, language toggle, India branding
 */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage } = useTranslationContext();

  const navLinks = [
    { href: '/#how-to-vote', label: 'How to Vote', labelHi: 'कैसे मतदान करें' },
    { href: '/timeline', label: 'Timeline', labelHi: 'समयरेखा' },
    { href: '/#eci-info', label: 'ECI Info', labelHi: 'ECI जानकारी' },
    { href: '/assistant', label: 'Ask Assistant', labelHi: 'सहायक से पूछें' },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-16 pt-6">
      <LiquidGlass rounded="rounded-xl" className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-white"
          aria-label="VoteAI India — Home"
        >
          VoteAI India
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {language === 'hi' ? link.labelHi : link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Language toggle + CTA */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="text-sm text-white/70 hover:text-white font-medium px-2 py-1 rounded transition-colors"
            aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
          >
            {language === 'en' ? 'हि' : 'EN'}
          </button>

          {/* CTA button */}
          <Link
            href="/assistant"
            className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            aria-label="Ask a question to VoteAI"
          >
            {language === 'hi' ? 'सवाल पूछें' : 'Ask a Question'}
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </LiquidGlass>

      {/* Mobile dropdown */}
      {menuOpen && (
        <LiquidGlass className="mt-2 px-4 py-3 flex flex-col gap-3 md:hidden rounded-xl" rounded="rounded-xl">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/80 hover:text-white text-sm py-1"
              onClick={() => setMenuOpen(false)}
            >
              {language === 'hi' ? link.labelHi : link.label}
            </Link>
          ))}
        </LiquidGlass>
      )}
    </header>
  );
}
