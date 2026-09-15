"use client";

/** Selectable size grid for the customer-facing product detail. */
export function SizeSelectGrid({
  sizes,
  availableSizes,
  selected,
  onSelect,
}: {
  /** Every number the grid draws: the seller's global list plus whatever this
   *  model carries outside it. */
  sizes: number[];
  availableSizes: number[];
  selected: number | null;
  onSelect: (size: number) => void;
}) {
  return (
    // Mobile: 5 fluid columns, 10px gap. Desktop: 5 columns capped at 72px, 12px gap.
    <div className="grid grid-cols-5 gap-[10px] md:gap-3 md:[grid-template-columns:repeat(5,minmax(0,72px))]">
      {sizes.map((n) => {
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
  sizes,
  active,
  onToggle,
}: {
  sizes: number[];
  active: number[];
  onToggle: (size: number) => void;
}) {
  return (
    // Mobile: 5 columns, 10px gap. Desktop: the full run of 10 on one row, 8px gap.
    <div className="grid grid-cols-5 gap-[10px] md:grid-cols-10 md:gap-2">
      {sizes.map((n) => {
        const on = active.includes(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToggle(n)}
            className={
              on
                ? "h-10 rounded-ui bg-ink text-paper flex items-center justify-center text-sm font-normal transition-transform active:scale-[.94]"
                : "h-10 rounded-ui bg-paper border border-ink-10 text-ink-25 flex items-center justify-center text-sm transition-[border-color,transform] hover:border-ink-25 active:scale-[.94]"
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
