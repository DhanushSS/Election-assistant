'use client';

import Link from 'next/link';
import { AnimatedHeading } from '../ui/AnimatedHeading';
import { FadeIn } from '../ui/FadeIn';
import { LiquidGlass } from '../ui/LiquidGlass';
import { Navbar } from '../layout/Navbar';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';

/**
 * HeroSection — full-screen video background with liquid-glass overlay.
 * Implements exact spec from prompt: video raw (no overlay), bottom-aligned content.
 */
export function HeroSection() {
  return (
    <section
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      aria-label="VoteAI India — Hero"
    >
      {/* ── Video Background ─────────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={VIDEO_URL}
      />

      {/* ── Navbar ───────────────────────────────────── */}
      <Navbar />

      {/* ── Hero Content — bottom-aligned ────────────── */}
      <div
        className="
          relative z-10 flex-1 flex flex-col justify-end
          px-6 md:px-12 lg:px-16 pb-12 lg:pb-16
          lg:grid lg:grid-cols-2 lg:items-end
        "
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Main Heading */}
          <AnimatedHeading
            text={"Understanding\nIndian Elections."}
            tag="h1"
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal text-white"
            charDelay={30}
            startDelay={200}
            duration={500}
          />

          {/* Subheading */}
          <FadeIn delay={800} duration={1000}>
            <p className="text-base md:text-lg text-gray-300 mb-5 mt-4 max-w-lg">
              Your AI-powered guide to Lok Sabha, state elections, voter registration, and the
              complete democratic process.
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={1200} duration={600}>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/assistant"
                className="bg-white text-black px-7 py-3 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500"
                aria-label="Open the VoteAI election assistant"
              >
                Ask the Assistant
              </Link>
              <Link
                href="/timeline"
                className="liquid-glass text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500"
                aria-label="View election timeline"
              >
                View Timeline
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* RIGHT COLUMN — Liquid glass info card */}
        <FadeIn delay={1400} duration={800} className="mt-10 lg:mt-0 lg:flex lg:justify-end">
          <LiquidGlass className="p-6 max-w-sm rounded-2xl" rounded="rounded-2xl">
            <p className="text-lg md:text-xl lg:text-2xl font-light text-white leading-snug">
              Lok Sabha.<br />State Elections.<br />Your Vote.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
              <span className="text-xs text-white/60">Powered by</span>
              <span className="text-xs font-medium text-white/80">Google Vertex AI</span>
            </div>
          </LiquidGlass>
        </FadeIn>
      </div>

      {/* ── Stats Bar ────────────────────────────────── */}
      <FadeIn delay={1600} duration={600}>
        <div className="relative z-10 flex gap-8 px-6 md:px-12 lg:px-16 pb-8">
          {[
            { value: '543', label: 'Lok Sabha Seats' },
            { value: '28+', label: 'States & UTs' },
            { value: '1950', label: 'Voter Helpline' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
