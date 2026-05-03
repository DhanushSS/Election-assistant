'use client';

import { type ReactNode } from 'react';

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  rounded?: string;
  as?: 'div' | 'section' | 'nav' | 'article';
}

/**
 * LiquidGlass — reusable dark glass card with gradient border.
 * Used in hero section, navbar, and cards on dark backgrounds.
 */
export function LiquidGlass({
  children,
  className = '',
  rounded = 'rounded-xl',
  as: Tag = 'div',
}: LiquidGlassProps) {
  return (
    <Tag className={`liquid-glass ${rounded} ${className}`}>
      {children}
    </Tag>
  );
}

/**
 * LiquidGlassLight — white glass for light-mode inner pages.
 */
export function LiquidGlassLight({
  children,
  className = '',
  rounded = 'rounded-xl',
}: Omit<LiquidGlassProps, 'as'>) {
  return (
    <div className={`liquid-glass-light ${rounded} ${className}`}>
      {children}
    </div>
  );
}
