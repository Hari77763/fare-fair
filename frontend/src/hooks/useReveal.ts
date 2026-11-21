'use client';

import { useEffect } from 'react';

/**
 * Reveals every `[data-reveal]` element once it scrolls into view by setting
 * `data-revealed="true"` (the transition lives in tokens.css). Re-scans when
 * `deps` change so newly rendered elements are picked up. One shared observer,
 * each element is unobserved after it reveals, so there is no ongoing cost.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const pending = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed="true"])')
    );
    if (pending.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      pending.forEach((el) => el.setAttribute('data-revealed', 'true'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    pending.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
