"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { BrandSheet } from "@/components/client/BrandSheet";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import type { Brand } from "@/lib/types";

export function CatalogControls({
  brands,
  countLabel,
}: {
  brands: Brand[];
  countLabel: React.ReactNode;
}) {
  const { filters, apply } = useCatalogFilter();
  const [query, setQuery] = useState(filters.q);
  const [queryError, setQueryError] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  // The field owns what is being typed, but the URL owns the active search —
  // it changes under us on a Back/Forward and when a shared link is read after
  // mount. Re-seeding on that change keeps the box showing the search the grid
  // is actually applying, without disturbing typing in between.
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (syncedQuery !== filters.q) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
    setQueryError(false);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = query.trim();
    if (v.length === 1) {
      setQueryError(true);
      return;
    }
    setQueryError(false);
    apply({ q: v.length >= 2 ? v : "" });
  }

  return (
    <div>
      <form onSubmit={onSearchSubmit} className="md:hidden flex gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setQueryError(false);
          }}
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
      {queryError ? (
        <div role="alert" className="mt-2 text-xs text-danger md:hidden" style={{ animation: "sfPop .2s ease both" }}>
          Digite ao menos 2 caracteres para buscar.
        </div>
      ) : null}

      <div className="mt-3 md:hidden">
        <FilterTabs active={filters.tab} onChange={(tab) => apply({ tab })} />
      </div>
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <FilterTabs active={filters.tab} onChange={(tab) => apply({ tab })} inline />
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
