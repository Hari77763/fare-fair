'use client';

import { useState, useEffect } from 'react';

export type PointerType = 'mouse' | 'touch' | 'pen';

/**
 * usePointerType Hook
 * Strictly isolates mouse precision (hover, spotlight, magnetic) from coarse touch ergonomics.
 * Evaluates matchMedia('(hover: hover) and (pointer: fine)') initially,
 * then dynamically tracks actual pointer input type per interaction with zero layout shifts.
 */
export function usePointerType(): {
  pointerType: PointerType;
  isFinePointer: boolean;
  isCoarsePointer: boolean;
} {
  const [pointerType, setPointerType] = useState<PointerType>('mouse');
  const [isFinePointer, setIsFinePointer] = useState<boolean>(true);

  useEffect(() => {
    // Initial hardware query
    const fineMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateFromMedia = (matches: boolean) => {
      setIsFinePointer(matches);
      setPointerType(matches ? 'mouse' : 'touch');
    };

    updateFromMedia(fineMedia.matches);

    const mediaListener = (e: MediaQueryListEvent) => updateFromMedia(e.matches);
    fineMedia.addEventListener('change', mediaListener);

    // Dynamic runtime interaction tracking (handles 2-in-1 hybrid convertibles & iPad trackpads)
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch') {
        setPointerType(e.pointerType);
        setIsFinePointer(e.pointerType === 'mouse');
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      fineMedia.removeEventListener('change', mediaListener);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return {
    pointerType,
    isFinePointer,
    isCoarsePointer: !isFinePointer,
  };
}
