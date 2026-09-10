"use client";

import { TABS, type Tab } from "@/lib/types";

export function FilterTabs({
  active,
  onChange,
  className = "",
  inline = false,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  className?: string;
  /**
   * Desktop-only: size each tab to its label (116px min) instead of splitting
   * the bar evenly. Mobile always splits evenly — 4 tabs at 116px overflow the
   * 24px gutters on a phone.
   */
  inline?: boolean;
}) {
  return (
    <div
      className={`h-10 bg-ink rounded-ui flex items-center ${inline ? "md:inline-flex" : ""} ${className}`}
    >
      {TABS.map((label) => {
        const on = active === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`h-10 flex-1 ${inline ? "md:flex-none md:min-w-[116px] md:px-3" : ""} rounded-ui text-xs whitespace-nowrap transition-colors duration-200 ${
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
