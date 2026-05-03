'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineNode } from './TimelineNode';
import { ScrollReveal } from '../ui/ScrollReveal';
import { ELECTION_TIMELINE_PHASES, type TimelinePhase } from '../../lib/constants/india-elections';
import { useTranslationContext } from '../../features/translation/TranslationContext';

/**
 * ElectionTimeline — 7-phase horizontal (desktop) / vertical (mobile) timeline.
 * Click a node → opens detail panel with phase info.
 */
export function ElectionTimeline() {
  const [activePhase, setActivePhase] = useState<TimelinePhase | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const { language } = useTranslationContext();

  // Scroll to detail panel when phase selected
  useEffect(() => {
    if (activePhase) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePhase]);

  return (
    <section aria-label="Indian Election Timeline" className="py-16 px-6 md:px-12 lg:px-16">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            {language === 'hi' ? 'चुनाव प्रक्रिया' : 'Election Process'}
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            {language === 'hi'
              ? 'भारतीय चुनाव की 7 प्रमुख चरणों को समझें'
              : 'Understand the 7 key phases of Indian elections. Click any phase to learn more.'}
          </p>
        </div>
      </ScrollReveal>

      {/* ── Desktop: horizontal timeline ── */}
      <div className="hidden lg:block relative" aria-label="Timeline phases">
        {/* Connecting line */}
        <div className="absolute top-10 left-0 right-0 h-0.5 bg-gray-200 z-0" aria-hidden="true" />

        <div className="relative z-10 flex justify-between items-start">
          {ELECTION_TIMELINE_PHASES.map((phase, idx) => (
            <TimelineNode
              key={phase.id}
              phase={phase}
              index={idx}
              isActive={activePhase?.id === phase.id}
              language={language}
              onClick={() => setActivePhase(activePhase?.id === phase.id ? null : phase)}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile: vertical timeline ── */}
      <div className="lg:hidden space-y-4">
        {ELECTION_TIMELINE_PHASES.map((phase, idx) => (
          <ScrollReveal key={phase.id} delay={idx * 80}>
            <button
              onClick={() => setActivePhase(activePhase?.id === phase.id ? null : phase)}
              className="w-full text-left flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              aria-expanded={activePhase?.id === phase.id}
              aria-controls={`phase-detail-${phase.id}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${phase.color}15` }}
                aria-hidden="true"
              >
                {phase.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-400">Phase {phase.phase}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {language === 'hi' ? phase.titleHi : phase.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {language === 'hi' ? phase.descriptionHi : phase.description}
                </p>
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      {/* ── Detail Panel ──────────────────── */}
      <AnimatePresence>
        {activePhase && (
          <motion.div
            ref={detailRef}
            id={`phase-detail-${activePhase.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-8 overflow-hidden"
            aria-live="polite"
          >
            <div
              className="rounded-2xl border-l-4 bg-white p-6 shadow-sm"
              style={{ borderColor: activePhase.color }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl" aria-hidden="true">{activePhase.icon}</span>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Phase {activePhase.phase}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {language === 'hi' ? activePhase.titleHi : activePhase.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {language === 'hi' ? activePhase.descriptionHi : activePhase.description}
              </p>

              <ul className="space-y-2">
                {activePhase.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span style={{ color: activePhase.color }} className="mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                    {detail}
                  </li>
                ))}
              </ul>

              <button
                className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setActivePhase(null)}
                aria-label="Close phase detail"
              >
                ✕ Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
