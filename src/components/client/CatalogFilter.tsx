"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ALL_TAB, type Tag } from "@/lib/types";

/** `tab` holds a tag name, or ALL_TAB. Names rather than ids keep a shared
 *  link readable and match what the tab bar shows. */
export type Filters = { tab: string; brand: string; q: string };

const DEFAULTS: Filters = { tab: ALL_TAB, brand: "Todas", q: "" };

/** What `match` needs from a row. Both the storefront card and the admin
 *  listing row satisfy it, so one filter serves both screens. */
export type Filterable = {
  name: string;
  tag_ids?: string[];
  brand?: { name: string } | null;
};

type CatalogFilter = {
  filters: Filters;
  apply: (next: Partial<Filters>, options?: { replace?: boolean }) => void;
  /** Narrows a list with the active filters. */
  match: <T extends Filterable>(items: T[]) => T[];
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
  basePath = "/",
  children,
}: {
  tags: Tag[];
  /** Where `apply` writes the query string. The admin listing shares this
   *  provider, and its filters have to stay on /admin. */
  basePath?: string;
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

  const apply = useCallback(
    (next: Partial<Filters>, options?: { replace?: boolean }) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        // History only — a server navigation here would undo the whole point.
        // Search replaces rather than pushes: it now runs as the box is typed
        // in, and one history entry per pause would turn Back into a rewind of
        // the search box instead of a way out of the page.
        const url = `${basePath}${toQuery(merged)}`;
        if (options?.replace) window.history.replaceState(null, "", url);
        else window.history.pushState(null, "", url);
        return merged;
      });
    },
    [basePath]
  );

  const activeTagId = tags.find((t) => t.name === filters.tab)?.id ?? null;

  const match = useCallback(
    <T extends Filterable>(items: T[]) => {
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

/** Below this a search matches almost everything, so it is treated as empty. */
const MIN_SEARCH = 2;

/**
 * Backs a search box that filters as it is typed.
 *
 * Returns the field's own value and a setter. Keystrokes settle for `delay`
 * before the filter is applied, so it runs once per pause rather than once per
 * letter, and the URL is rewritten in place — one history entry per pause would
 * turn Back into a rewind of the search box instead of a way off the page.
 *
 * Two details that are easy to get wrong:
 *
 * - The active search can also change from outside, on a Back/Forward or when
 *   a shared link is read after mount, and the field has to follow it. It must
 *   not follow the change *we* caused, though, or a fast typist loses the
 *   characters typed while our own value was being echoed back.
 * - A single character clears the filter instead of applying it, so deleting
 *   back to one letter shows everything again rather than freezing on the
 *   previous result.
 */
export function useCatalogSearch(delay = 250): [string, (v: string) => void] {
  const { filters, apply } = useCatalogFilter();
  const active = filters.q;

  const [value, setValue] = useState(active);
  /** The last search this hook applied, to tell our own echo from a navigation. */
  const [applied, setApplied] = useState(active);
  const [synced, setSynced] = useState(active);

  if (synced !== active) {
    setSynced(active);
    if (active !== applied) {
      setApplied(active);
      setValue(active);
    }
  }

  useEffect(() => {
    const trimmed = value.trim();
    const next = trimmed.length >= MIN_SEARCH ? trimmed : "";
    if (next === active) return;
    const timer = setTimeout(() => {
      setApplied(next);
      apply({ q: next }, { replace: true });
    }, delay);
    return () => clearTimeout(timer);
  }, [value, active, apply, delay]);

  return [value, setValue];
}

export function useCatalogFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogFilter must be used within a CatalogFilterProvider");
  return ctx;
}
