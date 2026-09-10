"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { TABS, type Tab } from "@/lib/types";
import { BrandSheet } from "@/components/client/BrandSheet";
import type { Brand } from "@/lib/types";

export function CatalogControls({
  brands,
  countLabel,
}: {
  brands: Brand[];
  countLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [queryError, setQueryError] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const activeTab = (searchParams.get("tab") as Tab) ?? "Todos";
  const activeBrand = searchParams.get("brand") ?? "Todas";

  function goWithParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = query.trim();
    if (v.length === 1) {
      setQueryError(true);
      return;
    }
    setQueryError(false);
    goWithParams({ q: v.length >= 2 ? v : null });
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
          className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-r bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
        />
        <button
          type="button"
          onClick={() => setBrandOpen(true)}
          className="flex-none h-10 min-w-[116px] px-3 rounded-r bg-ink text-paper text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-[.86] active:scale-[.96]"
        >
          <span>{activeBrand === "Todas" ? "Marca" : activeBrand}</span>
          <IconChevronDown stroke="#FAFAFA" />
        </button>
      </form>
      {queryError ? (
        <div className="mt-2 text-xs text-ink-50 md:hidden" style={{ animation: "sfPop .2s ease both" }}>
          Digite ao menos 2 caracteres para buscar.
        </div>
      ) : null}

      <div className="mt-3 md:hidden">
        <FilterTabs
          active={TABS.includes(activeTab) ? activeTab : "Todos"}
          onChange={(t) => goWithParams({ tab: t === "Todos" ? null : t })}
        />
      </div>
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <FilterTabs
          active={TABS.includes(activeTab) ? activeTab : "Todos"}
          onChange={(t) => goWithParams({ tab: t === "Todos" ? null : t })}
          inline
        />
        <div className="text-xs text-ink-25">{countLabel}</div>
      </div>

      <BrandSheet
        open={brandOpen}
        onClose={() => setBrandOpen(false)}
        brands={brands}
        activeBrand={activeBrand}
        onSelect={(b) => {
          setBrandOpen(false);
          goWithParams({ brand: b === "Todas" ? null : b });
        }}
      />
    </div>
  );
}
