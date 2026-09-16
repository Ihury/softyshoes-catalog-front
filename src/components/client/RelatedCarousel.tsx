"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/client/ProductCard";
import type { CatalogItem } from "@/lib/types";

export function RelatedCarousel({ products }: { products: CatalogItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const paint = () => {
      const box = node.getBoundingClientRect();
      for (const card of Array.from(node.children) as HTMLElement[]) {
        const r = card.getBoundingClientRect();
        const inRight = (box.right - r.left) / r.width;
        const inLeft = (r.right - box.left) / r.width;
        const t = Math.max(0, Math.min(1, Math.min(inRight, inLeft)));
        const e = t * t * (3 - 2 * t);
        card.style.opacity = (0.25 + 0.75 * e).toFixed(3);
        card.style.transform = `scale(${(0.97 + 0.03 * e).toFixed(3)})`;
      }
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        paint();
      });
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(paint);

    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 0) return;
      e.preventDefault();
      node.scrollLeft += e.deltaY;
    };
    node.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      node.removeEventListener("scroll", onScroll);
      node.removeEventListener("wheel", onWheel);
    };
  }, [products]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const node = e.currentTarget;
    if (e.pointerType === "touch") return;
    const startX = e.clientX;
    const startLeft = node.scrollLeft;
    let moved = false;
    node.style.cursor = "grabbing";
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      node.scrollLeft = startLeft - dx;
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up, true);
      node.style.cursor = "grab";
      if (moved) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, true);
  }

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-ink-50">Também selecionados</div>
        <div className="text-xs text-ink-25">Arraste para ver.</div>
      </div>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        className="no-scrollbar mt-3 md:mt-4 -mx-[clamp(16px,5vw,24px)] md:mx-0 px-[clamp(16px,5vw,24px)] md:px-0 flex gap-3 md:gap-6 overflow-x-auto cursor-grab"
        style={{ touchAction: "pan-x pan-y", scrollPaddingInlineStart: 24 }}
      >
        {products.map((p) => (
          // The same width as a card in the grid above, so the two rows read as
          // one catalog rather than two sizes of the same thing. A scroller has
          // no auto-fill to copy, so the grid's column count is reproduced per
          // breakpoint against the same container width and the same gaps —
          // 2 up to md, then 3, 4 and 5, which is exactly where
          // `auto-fill minmax(150/200px, 1fr)` lands.
          <div
            key={p.id}
            className="flex-none w-[calc((100%-12px)/2)] md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)] xl:w-[calc((100%-96px)/5)]"
            style={{ willChange: "opacity, transform" }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
