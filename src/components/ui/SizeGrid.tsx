"use client";

import { SIZES } from "@/lib/types";

/** Selectable size grid for the customer-facing product detail. */
export function SizeSelectGrid({
  availableSizes,
  selected,
  onSelect,
  columns = 5,
}: {
  availableSizes: number[];
  selected: number | null;
  onSelect: (size: number) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-[10px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {SIZES.map((n) => {
        const disabled = !availableSizes.includes(n);
        const isSelected = !disabled && selected === n;
        if (disabled) {
          return (
            <span
              key={n}
              className="h-10 rounded-ui bg-ink-10 flex items-center justify-center text-sm text-ink-25"
            >
              {n}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={
              isSelected
                ? "h-10 rounded-ui bg-ink text-paper flex items-center justify-center text-sm font-normal transition-transform active:scale-[.94]"
                : "h-10 rounded-ui bg-paper border border-ink-10 text-ink flex items-center justify-center text-sm transition-[border-color,transform] hover:border-ink-25 active:scale-[.94]"
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle grid used by admin to define which sizes a model carries. */
export function SizeToggleGrid({
  active,
  onToggle,
  columns = 5,
}: {
  active: number[];
  onToggle: (size: number) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-[10px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {SIZES.map((n) => {
        const on = active.includes(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToggle(n)}
            className={
              on
                ? "h-10 rounded-ui bg-ink text-paper flex items-center justify-center text-sm font-normal transition-transform active:scale-[.94]"
                : "h-10 rounded-ui bg-paper border border-ink-10 text-ink-25 flex items-center justify-center text-sm transition-[border-color,color,transform] hover:border-ink-25 hover:text-ink-50 active:scale-[.94]"
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
