'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Radio-group segmented control with a spring-animated sliding thumb.
 * Arrow keys move the selection, matching native radio behaviour.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedProps<T>) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const activeIndex = options.findIndex((o) => o.value === value);

  useLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current[activeIndex];
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    itemRefs.current.forEach((el) => el && ro?.observe(el));
    return () => ro?.disconnect();
  }, [activeIndex, options.length]);

  const move = (dir: 1 | -1) => {
    const enabled = options.map((o, i) => (!o.disabled ? i : -1)).filter((i) => i >= 0);
    const pos = enabled.indexOf(activeIndex);
    const next = enabled[(pos + dir + enabled.length) % enabled.length];
    onChange(options[next].value);
    itemRefs.current[next]?.focus();
  };

  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-[13px]';

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`segmented ${className}`}>
      {thumb && (
        <span
          aria-hidden="true"
          className="segmented-thumb"
          style={{ width: thumb.w, transform: `translate3d(${thumb.x - 3}px, 0, 0)`, marginLeft: 3 }}
        />
      )}
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={opt.disabled}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                move(1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                move(-1);
              }
            }}
            className={`relative z-[1] rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${pad} ${
              selected
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
