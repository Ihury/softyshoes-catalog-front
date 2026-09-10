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
  inline?: boolean;
}) {
  return (
    <div
      className={`h-10 bg-ink rounded-r flex items-center ${inline ? "inline-flex" : ""} ${className}`}
    >
      {TABS.map((label) => {
        const on = active === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`h-10 ${inline ? "min-w-[116px] px-3" : "flex-1"} rounded-r text-xs whitespace-nowrap transition-colors duration-200 ${
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
