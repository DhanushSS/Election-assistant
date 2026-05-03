'use client';

import { useRef, useEffect, useState } from 'react';
import type { TimelinePhase } from '../../lib/constants/india-elections';

interface TimelineNodeProps {
  phase: TimelinePhase;
  index: number;
  isActive: boolean;
  language: 'en' | 'hi';
  onClick: () => void;
}

/**
 * TimelineNode — staggered pop-in animation on scroll, pulsing when active.
 */
export function TimelineNode({ phase, index, isActive, language, onClick }: TimelineNodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setVisible(true), index * 120);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, prefersReduced]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center flex-1 relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        transition: `opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s,
                     transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s`,
      }}
    >
      {/* Node circle */}
      <button
        onClick={onClick}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center text-xl
          border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
          ${isActive
            ? 'border-current scale-110 shadow-lg'
            : 'border-gray-200 bg-white hover:border-current hover:scale-105'}
        `}
        style={{
          borderColor: isActive ? phase.color : undefined,
          backgroundColor: isActive ? `${phase.color}15` : undefined,
        }}
        aria-pressed={isActive}
        aria-label={`Phase ${phase.phase}: ${language === 'hi' ? phase.titleHi : phase.title}. ${isActive ? 'Click to close' : 'Click to expand'}`}
      >
        <span aria-hidden="true">{phase.icon}</span>

        {/* Pulse ring for active */}
        {isActive && (
          <span
            className="absolute inset-0 rounded-full border-2 animate-ping"
            style={{ borderColor: phase.color }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Label */}
      <div className="mt-3 text-center px-1">
        <p className="text-xs font-medium text-gray-400">Phase {phase.phase}</p>
        <p className={`text-xs font-semibold mt-0.5 max-w-[80px] leading-tight ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
          {language === 'hi' ? phase.titleHi : phase.title}
        </p>
        {phase.isDeadline && (
          <span className="inline-block mt-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
            Deadline
          </span>
        )}
      </div>
    </div>
  );
}
