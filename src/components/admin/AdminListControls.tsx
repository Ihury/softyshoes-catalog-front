"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { AdminBrandSheet } from "@/components/admin/AdminBrandSheet";
import { useCatalogFilter, useCatalogSearch } from "@/components/client/CatalogFilter";
import type { Brand, Filter } from "@/lib/types";

export function AdminListControls({
  brands,
  filters: registry,
  countLabel,
}: {
  brands: Brand[];
  filters: Filter[];
  countLabel: string;
}) {
  const { filters, active, apply } = useCatalogFilter();
  const [query, setQuery] = useCatalogSearch();
  const [brandOpen, setBrandOpen] = useState(false);

  // The same tabs the storefront shows, so the seller filters their own list
  // by the labels their shoppers see.
  const tabs = registry.map((f) => f.name);
  const activeTab = active?.name ?? "";

  return (
    <div>
      <div className="flex items-baseline justify-between md:hidden">
        <div className="text-xs text-ink-50">Catálogo</div>
        <div className="text-xs text-ink-25">{countLabel}</div>
      </div>

      <div className="mt-3 md:mt-0 md:flex md:items-center md:justify-between md:gap-6">
        <div className="text-md font-normal hidden md:block">Catálogo</div>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {/* Submitting is a no-op: the search runs as it is typed. The form
              stays so Enter dismisses the keyboard on a phone. */}
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-3 flex-1 min-w-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelo, marca ou etiqueta"
              aria-label="Buscar modelo, marca ou etiqueta"
              className="flex-1 md:max-w-[280px] min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
            />
            <button
              type="button"
              onClick={() => setBrandOpen(true)}
              className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper md:bg-paper md:border md:border-ink-10 md:text-ink text-sm flex items-center justify-center gap-2 transition-[opacity,border-color] hover:opacity-80 md:hover:opacity-100 md:hover:border-ink-25"
            >
              <span>{filters.brand === "Todas" ? "Marca" : filters.brand}</span>
              <IconChevronDown className="text-paper md:text-ink" stroke="currentColor" />
            </button>
          </form>
          <Link
            href="/admin/produtos/novo"
            className="hidden md:inline-flex h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm items-center justify-center font-normal transition-opacity hover:opacity-80 active:scale-[.97]"
          >
            Novo modelo
          </Link>
        </div>
      </div>
      {tabs.length ? (
        <div className="mt-3 md:mt-6 overflow-x-auto no-scrollbar">
          <FilterTabs
            tabs={tabs}
            active={activeTab}
            onChange={(tab) => apply({ tab })}
            inline
            className="md:inline-flex"
          />
        </div>
      ) : null}

      <AdminBrandSheet
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
