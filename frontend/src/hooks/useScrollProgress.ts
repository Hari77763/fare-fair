'use client';

import { useState, useEffect } from 'react';

/**
 * useScrollProgress Hook
 * Computes window scroll percentage and scrollY position in requestAnimationFrame
 * with zero layout jank and respects prefers-reduced-motion.
 */
export function useScrollProgress(): {
  scrollProgress: number; // 0 to 1
  scrollY: number;
  prefersReducedMotion: boolean;
} {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionListener);

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = maxScroll > 0 ? Math.min(Math.max(currentY / maxScroll, 0), 1) : 0;
          
          setScrollY(currentY);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      motionQuery.removeEventListener('change', motionListener);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return { scrollProgress, scrollY, prefersReducedMotion };
}
