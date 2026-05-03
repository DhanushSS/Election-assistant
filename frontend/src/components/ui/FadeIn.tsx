'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;        // ms
  duration?: number;     // ms
  className?: string;
}

/**
 * FadeIn — opacity 0→1 with configurable delay and duration.
 * Respects prefers-reduced-motion.
 */
export function FadeIn({ children, delay = 0, duration = 600, className = '' }: FadeInProps) {
  const [visible, setVisible] = useState(false);
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (prefersReduced.current) { setVisible(true); return; }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
      }}
    >
      {children}
    </div>
  );
}
