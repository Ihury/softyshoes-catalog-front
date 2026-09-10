"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { IconChevronDown } from "@/components/icons";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { TABS, type Tab, type Brand } from "@/lib/types";
import { AdminBrandSheet } from "@/components/admin/AdminBrandSheet";

export function AdminListControls({ brands, countLabel }: { brands: Brand[]; countLabel: string }) {
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
    router.push(`/admin${params.toString() ? `?${params.toString()}` : ""}`);
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
      <div className="flex items-baseline justify-between md:hidden">
        <div className="text-xs text-ink-50">Catálogo</div>
        <div className="text-xs text-ink-25">{countLabel}</div>
      </div>

      <div className="mt-3 md:mt-0 md:flex md:items-center md:justify-between md:gap-6">
        <div className="text-md font-normal hidden md:block">Catálogo</div>
        <div className="flex items-center gap-3">
          <form onSubmit={onSearchSubmit} className="flex gap-3 flex-1 md:flex-none">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setQueryError(false);
              }}
              placeholder="Buscar modelo"
              aria-label="Buscar modelo"
              className="flex-1 md:w-[280px] min-w-0 h-10 px-4 border border-ink-10 rounded-r bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
            />
            <button
              type="button"
              onClick={() => setBrandOpen(true)}
              className="flex-none h-10 min-w-[116px] px-3 rounded-r bg-ink text-paper md:bg-paper md:border md:border-ink-10 md:text-ink text-sm flex items-center justify-center gap-2 transition-[opacity,border-color] hover:opacity-[.86] md:hover:opacity-100 md:hover:border-ink-25"
            >
              <span>{activeBrand === "Todas" ? "Marca" : activeBrand}</span>
              <IconChevronDown className="text-paper md:text-ink" stroke="currentColor" />
            </button>
          </form>
          <Link
            href="/admin/produtos/novo"
            className="hidden md:inline-flex h-10 min-w-[116px] px-3 rounded-r bg-ink text-paper text-sm items-center justify-center font-normal transition-opacity hover:opacity-[.86] active:scale-[.97]"
          >
            Novo modelo
          </Link>
        </div>
      </div>
      {queryError ? (
        <div className="mt-2 text-xs text-ink-50" style={{ animation: "sfPop .2s ease both" }}>
          Digite ao menos 2 caracteres para buscar.
        </div>
      ) : null}

      <div className="mt-3 md:mt-6">
        <FilterTabs
          active={TABS.includes(activeTab) ? activeTab : "Todos"}
          onChange={(t) => goWithParams({ tab: t === "Todos" ? null : t })}
          inline
          className="md:inline-flex"
        />
      </div>

      <AdminBrandSheet
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
