"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/client/ProductCard";
import type { Product } from "@/lib/types";

export function RelatedCarousel({ products }: { products: Product[] }) {
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
        className="no-scrollbar mt-3 md:mt-4 -mx-6 md:mx-0 px-6 md:px-0 flex gap-[18px] md:gap-6 overflow-x-auto cursor-grab"
        style={{ touchAction: "pan-x pan-y", scrollPaddingInlineStart: 24 }}
      >
        {products.map((p) => (
          <div key={p.id} className="flex-none w-[161px] md:w-[236px]" style={{ willChange: "opacity, transform" }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
