'use client';

import { useEffect } from 'react';

/**
 * Renders the ambient light field that glass surfaces refract, and moves each
 * glass panel's specular highlight toward the pointer.
 *
 * One delegated pointer listener for the whole page, throttled to one write
 * per frame, mouse only (touch devices keep the static highlight). Only CSS
 * custom properties change, so React never re-renders.
 */
export function LiquidGlass() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      frame = 0;
      if (!last) return;
      const target = (last.target as Element | null)?.closest?.('.glass') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((last.clientX - rect.left) / rect.width) * 100;
      const y = ((last.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty('--gx', `${x.toFixed(1)}%`);
      target.style.setProperty('--gy', `${y.toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
