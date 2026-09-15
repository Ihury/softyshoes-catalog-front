"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { BrandSheet } from "@/components/client/BrandSheet";
import { useCatalogFilter, useCatalogSearch } from "@/components/client/CatalogFilter";
import type { Brand, Filter } from "@/lib/types";

export function CatalogControls({
  brands,
  filters: registry,
  countLabel,
}: {
  brands: Brand[];
  filters: Filter[];
  countLabel: React.ReactNode;
}) {
  const { filters, active, apply } = useCatalogFilter();
  const [query, setQuery] = useCatalogSearch();
  const [brandOpen, setBrandOpen] = useState(false);

  // Every tab is a row now, "Todos" included, so a seller who deletes them all
  // simply gets no bar and an unfiltered grid.
  const tabs = registry.map((f) => f.name);
  const activeTab = active?.name ?? "";

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
          className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-80 active:scale-[.96]"
        >
          <span>{filters.brand === "Todas" ? "Marca" : filters.brand}</span>
          <IconChevronDown stroke="#FAFAFA" />
        </button>
      </form>

      {/* The count moved onto the phone too: with a fluid grid the number of
          rows no longer tells you how many models matched. */}
      <div className="mt-4 md:hidden flex items-baseline justify-between gap-3 text-xs">
        <span className="text-ink-50">Catálogo</span>
        <span className="text-ink-25">{countLabel}</span>
      </div>

      {tabs.length ? (
        <div className="mt-2 md:hidden overflow-x-auto no-scrollbar">
          <FilterTabs tabs={tabs} active={activeTab} onChange={(tab) => apply({ tab })} />
        </div>
      ) : null}

      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        {tabs.length ? (
          <FilterTabs tabs={tabs} active={activeTab} onChange={(tab) => apply({ tab })} inline />
        ) : (
          <span />
        )}
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
