'use client';

import { useEffect, useState } from 'react';

interface AnimatedHeadingProps {
  text: string;           // Use \n for line breaks
  tag?: 'h1' | 'h2' | 'h3';
  className?: string;
  charDelay?: number;     // ms between each char
  startDelay?: number;    // ms before animation starts
  duration?: number;      // ms per char transition
}

/**
 * AnimatedHeading — character-by-character staggered animation.
 * Each char: opacity 0 + translateX(-18px) → opacity 1 + translateX(0)
 */
export function AnimatedHeading({
  text,
  tag: Tag = 'h1',
  className = '',
  charDelay = 30,
  startDelay = 200,
  duration = 500,
}: AnimatedHeadingProps) {
  const [started, setStarted] = useState(false);
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  const lines = text.split('\n');
  let charIndex = 0;

  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} style={{ display: 'block' }}>
          {line.split('').map((char) => {
            const idx = charIndex++;
            const delay = startDelay + idx * charDelay;
            const isSpace = char === ' ';

            return (
              <span
                key={idx}
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  opacity: prefersReduced || started ? 1 : 0,
                  transform: prefersReduced || started ? 'translateX(0)' : 'translateX(-18px)',
                  transition: prefersReduced
                    ? 'none'
                    : `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
                  whiteSpace: 'pre',
                }}
              >
                {isSpace ? '\u00A0' : char}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
