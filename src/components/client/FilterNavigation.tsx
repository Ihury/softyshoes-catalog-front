"use client";

import { createContext, useContext, useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TABS, type Tab } from "@/lib/types";

export type Filters = { tab: Tab; brand: string; q: string };

type FilterNavigation = {
  /** Filters as the user last expressed them — updated before the server
   *  answers, so a tab highlights the instant it is tapped. */
  filters: Filters;
  /** True while the new listing is on its way. */
  pending: boolean;
  apply: (next: Partial<Filters>) => void;
};

const Ctx = createContext<FilterNavigation | null>(null);

function toQuery({ tab, brand, q }: Filters) {
  const params = new URLSearchParams();
  if (tab !== "Todos") params.set("tab", tab);
  if (brand && brand !== "Todas") params.set("brand", brand);
  if (q) params.set("q", q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Shares one optimistic filter state between the controls and the results.
 *
 * Navigation runs inside a transition, so React keeps the current results on
 * screen while the next ones load instead of blanking the page, and
 * `useOptimistic` lets the tab bar reflect the tap immediately rather than
 * waiting for the round-trip. Re-picking a filter the router already has
 * cached resolves without touching the network at all.
 */
export function FilterNavigationProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const tabParam = searchParams.get("tab") as Tab | null;
  const fromUrl: Filters = {
    tab: tabParam && TABS.includes(tabParam) ? tabParam : "Todos",
    brand: searchParams.get("brand") ?? "Todas",
    q: searchParams.get("q") ?? "",
  };

  const [filters, setFilters] = useOptimistic(fromUrl, (_prev, next: Filters) => next);

  function apply(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    startTransition(() => {
      setFilters(merged);
      router.push(`${basePath}${toQuery(merged)}`);
    });
  }

  return <Ctx.Provider value={{ filters, pending, apply }}>{children}</Ctx.Provider>;
}

export function useFilterNavigation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilterNavigation must be used within a FilterNavigationProvider");
  return ctx;
}

/**
 * Wraps the server-rendered listing. While the next page is loading it keeps
 * the current results in place and shows the handoff's 1px progress bar above
 * them — no skeletons, no blank screen.
 */
export function FilterResults({ children }: { children: React.ReactNode }) {
  const { pending } = useFilterNavigation();
  return (
    <div>
      <div className="relative h-px overflow-hidden" aria-hidden={!pending}>
        {pending ? (
          <div
            className="absolute inset-0 bg-ink-03"
            role="progressbar"
            aria-label="Carregando modelos"
          >
            <div
              className="w-[30%] h-full bg-ink-25"
              style={{ animation: "sfBar 1.1s cubic-bezier(.5,0,.5,1) infinite" }}
            />
          </div>
        ) : null}
      </div>
      <div
        className="transition-opacity duration-200"
        style={pending ? { opacity: 0.65 } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
