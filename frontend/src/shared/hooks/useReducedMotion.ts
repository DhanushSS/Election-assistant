'use client';

import { useState, useEffect } from 'react';

/**
 * useReducedMotion — Respects user's OS-level motion preference.
 *
 * WCAG 2.3.3 (Animation from Interactions, AAA) and 2.3.1 — ensures
 * no animation causes discomfort for users with vestibular disorders.
 *
 * Usage:
 *   const reducedMotion = useReducedMotion();
 *   const duration = reducedMotion ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
