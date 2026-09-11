"use client";

/**
 * The labels are passed in rather than fixed here: the storefront builds them
 * from the seller's tags, while the admin listing still uses its own three.
 */
export function FilterTabs({
  tabs,
  active,
  onChange,
  className = "",
  inline = false,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  className?: string;
  /**
   * Desktop-only: size each tab to its label (116px min) instead of splitting
   * the bar evenly. Mobile always splits evenly — 4 tabs at 116px overflow the
   * 24px gutters on a phone.
   */
  inline?: boolean;
}) {
  // Up to four labels share the bar evenly, as the handoff draws it. Past that
  // an even split gives slivers, so each tab takes its own width and the row
  // scrolls sideways instead.
  const even = tabs.length <= 4;

  return (
    <div
      className={`h-10 bg-ink rounded-ui flex items-center ${even ? "" : "w-max min-w-full"} ${inline ? "md:inline-flex" : ""} ${className}`}
    >
      {tabs.map((label) => {
        const on = active === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`h-10 ${even ? "flex-1" : "flex-none px-4"} ${inline ? "md:flex-none md:min-w-[116px] md:px-3" : ""} rounded-ui text-xs whitespace-nowrap transition-colors duration-200 ${
              on ? "text-paper font-normal" : "text-paper-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
