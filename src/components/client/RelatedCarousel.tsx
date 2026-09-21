"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/client/ProductCard";
import type { CatalogItem } from "@/lib/types";

/** The `gap-3` / `md:gap-6` between cards, which the step has to clear. Read
 *  from the DOM rather than hard-coded, so the two breakpoints stay honest. */
const gapOf = (node: HTMLElement) => parseFloat(getComputedStyle(node).columnGap || "0") || 0;

/** How long the row rests before it steps to the next card. Matches the home
 *  highlight, so the two moving things on the site keep the same pulse. */
const AUTOPLAY_MS = 10_000;
/** How long it stays still after someone scrolls it themselves. */
const RESUME_MS = 12_000;

export function RelatedCarousel({ products }: { products: CatalogItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);

  const pause = () => {
    pausedUntil.current = Date.now() + RESUME_MS;
  };

  // Steps one card at a time and returns to the start at the end, so the row
  // keeps offering what is further along without anyone having to touch it.
  useEffect(() => {
    const node = ref.current;
    if (!node || products.length < 2) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 1) return;
      const card = node.children[0] as HTMLElement | undefined;
      if (!card) return;
      const step = card.getBoundingClientRect().width + gapOf(node);
      const next = node.scrollLeft + step;
      node.scrollTo({ left: next > max - 1 ? 0 : next, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [products.length]);

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
    node.addEventListener("wheel", pause, { passive: true });
    node.addEventListener("touchstart", pause, { passive: true });
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
      node.removeEventListener("wheel", pause);
      node.removeEventListener("touchstart", pause);
    };
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-ink-50">Também selecionados</div>
        {/* The handoff says "Arraste para ver." here, but the row no longer
            answers a drag: on a desktop it fought the pointer and swallowed
            clicks on the cards. It advances on its own instead, so the line
            says what it now does. */}
        <div className="text-xs text-ink-25">Role para ver mais.</div>
      </div>
      <div
        ref={ref}
        onPointerDown={pause}
        className="no-scrollbar mt-3 md:mt-4 -mx-[clamp(16px,5vw,24px)] md:mx-0 px-[clamp(16px,5vw,24px)] md:px-0 flex gap-3 md:gap-6 overflow-x-auto"
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
