'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Calls `onDismiss` when the user presses Escape or interacts outside every
 * element in `refs`, while `active` is true. Used for popovers and menus.
 */
export function useDismiss(
  refs: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onDismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // refs are stable ref objects; onDismiss may change identity each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onDismiss]);
}
