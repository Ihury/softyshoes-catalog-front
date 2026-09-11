"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ALL_TAB, type CatalogItem, type Tag } from "@/lib/types";

/** `tab` holds a tag name, or ALL_TAB. Names rather than ids keep a shared
 *  link readable and match what the tab bar shows. */
export type Filters = { tab: string; brand: string; q: string };

const DEFAULTS: Filters = { tab: ALL_TAB, brand: "Todas", q: "" };

type CatalogFilter = {
  filters: Filters;
  apply: (next: Partial<Filters>) => void;
  /** Narrows a list with the active filters. */
  match: (items: CatalogItem[]) => CatalogItem[];
};

const Ctx = createContext<CatalogFilter | null>(null);

function parse(search: string, names: string[]): Filters {
  const p = new URLSearchParams(search);
  const tab = p.get("tab");
  // A link to a tag that has since been renamed or deleted falls back to
  // showing everything, rather than an empty grid with no way out.
  return {
    tab: tab && names.includes(tab) ? tab : ALL_TAB,
    brand: p.get("brand") ?? "Todas",
    q: p.get("q") ?? "",
  };
}

function toQuery({ tab, brand, q }: Filters) {
  const p = new URLSearchParams();
  if (tab !== ALL_TAB) p.set("tab", tab);
  if (brand && brand !== "Todas") p.set("brand", brand);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Filters the storefront in the browser.
 *
 * The catalog is small enough to ship whole, so narrowing it here costs
 * nothing and buys two things the server could not: filtering is instant, with
 * no round-trip at all, and — because nothing reads `useSearchParams` — the
 * pages stay statically renderable and get served from the CDN instead of
 * waking a function on every visit.
 *
 * Filters start at their defaults and are read from the URL after mount, which
 * is what keeps the render static. A shared link with a filter therefore paints
 * unfiltered for one frame before settling.
 */
export function CatalogFilterProvider({
  tags,
  children,
}: {
  tags: Tag[];
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);

  // Joined so the effect below depends on the tag names themselves rather than
  // on a fresh array identity from every server render.
  const nameKey = tags.map((t) => t.name).join("\u0000");

  useEffect(() => {
    const known = nameKey ? nameKey.split("\u0000") : [];
    const sync = () => setFilters(parse(window.location.search, known));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [nameKey]);

  const apply = useCallback((next: Partial<Filters>) => {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      // History only — a server navigation here would undo the whole point.
      window.history.pushState(null, "", `/${toQuery(merged)}`);
      return merged;
    });
  }, []);

  const activeTagId = tags.find((t) => t.name === filters.tab)?.id ?? null;

  const match = useCallback(
    (items: CatalogItem[]) => {
      const q = filters.q.trim().toLowerCase();
      return items.filter((p) => {
        if (activeTagId && !(p.tag_ids ?? []).includes(activeTagId)) return false;
        if (filters.brand !== "Todas" && p.brand?.name !== filters.brand) return false;
        if (q.length >= 2 && !p.name.toLowerCase().includes(q)) return false;
        return true;
      });
    },
    [filters, activeTagId]
  );

  const value = useMemo(() => ({ filters, apply, match }), [filters, apply, match]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogFilter must be used within a CatalogFilterProvider");
  return ctx;
}
