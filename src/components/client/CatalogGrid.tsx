"use client";

import { ProductCard } from "@/components/client/ProductCard";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import type { CatalogItem } from "@/lib/types";

/**
 * Renders the catalog grid from the full list the page shipped, narrowed by
 * the active filters. No request is made when a filter changes.
 */
export function CatalogGrid({ products }: { products: CatalogItem[] }) {
  const { match } = useCatalogFilter();
  const shown = match(products);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-8">
        {shown.map((p, i) => (
          <ProductCard key={p.id} product={p} delayStep={i} />
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="py-12 md:py-24 text-center text-sm text-ink-50">Nenhum modelo encontrado.</div>
      ) : (
        <div className="mt-6 md:mt-10 text-xs text-ink-25">Selecionado SOFTY.</div>
      )}
    </>
  );
}

/** The model count beside the desktop filter bar, which also follows the filters. */
export function CatalogCount({ products }: { products: CatalogItem[] }) {
  const { match } = useCatalogFilter();
  const n = match(products).length;
  return <>{n} {n === 1 ? "modelo" : "modelos"}</>;
}
