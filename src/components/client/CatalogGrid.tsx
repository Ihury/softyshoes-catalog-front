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
      {/* Fluid rather than a fixed column count: the columns follow the width
          available, so a narrow phone gets two and a wide desktop gets five
          without a breakpoint for each. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-x-6 md:gap-y-8">
        {shown.map((p, i) => (
          <ProductCard key={p.id} product={p} delayStep={i} />
        ))}
      </div>

      {shown.length === 0 ? (
        // Centred in the space left between the filters and the bottom of the
        // screen rather than tucked under the controls, so on a wide display the
        // message lands where the eye already is instead of stranded up top.
        <div className="flex-1 flex items-center justify-center py-12 md:py-24 text-center text-sm text-ink-50">
          Nenhum modelo encontrado.
        </div>
      ) : (
        <div className="mt-6 md:mt-10 text-xs text-ink-25">Selecionado SOFTY.</div>
      )}
    </>
  );
}

/** The model count beside the filter bar, which also follows the filters. */
export function CatalogCount({ products }: { products: CatalogItem[] }) {
  const { match } = useCatalogFilter();
  const n = match(products).length;
  return <>{n} {n === 1 ? "modelo" : "modelos"}</>;
}
