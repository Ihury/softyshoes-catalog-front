"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { BrandSheet } from "@/components/client/BrandSheet";
import { useCatalogFilter, useCatalogSearch } from "@/components/client/CatalogFilter";
import { ALL_TAB, type Brand, type Tag } from "@/lib/types";

export function CatalogControls({
  brands,
  tags,
  countLabel,
}: {
  brands: Brand[];
  tags: Tag[];
  countLabel: React.ReactNode;
}) {
  const { filters, apply } = useCatalogFilter();
  const [query, setQuery] = useCatalogSearch();
  const [brandOpen, setBrandOpen] = useState(false);

  // "Todos" is not a tag — it is the absence of one — so it is prepended here
  // rather than stored. A seller with no tags simply gets a single tab.
  const tabs = [ALL_TAB, ...tags.map((t) => t.name)];

  return (
    <div>
      {/* Submitting is a no-op: the search already ran while it was typed.
          The form stays so Enter dismisses the keyboard on a phone. */}
      <form onSubmit={(e) => e.preventDefault()} className="md:hidden flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar modelo"
          aria-label="Buscar modelo"
          className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
        />
        <button
          type="button"
          onClick={() => setBrandOpen(true)}
          className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-[.86] active:scale-[.96]"
        >
          <span>{filters.brand === "Todas" ? "Marca" : filters.brand}</span>
          <IconChevronDown stroke="#FAFAFA" />
        </button>
      </form>
      <div className="mt-3 md:hidden overflow-x-auto no-scrollbar">
        <FilterTabs tabs={tabs} active={filters.tab} onChange={(tab) => apply({ tab })} />
      </div>
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <FilterTabs tabs={tabs} active={filters.tab} onChange={(tab) => apply({ tab })} inline />
        <div className="text-xs text-ink-25">{countLabel}</div>
      </div>

      <BrandSheet
        open={brandOpen}
        onClose={() => setBrandOpen(false)}
        brands={brands}
        activeBrand={filters.brand}
        onSelect={(brand) => {
          setBrandOpen(false);
          apply({ brand });
        }}
      />
    </div>
  );
}
