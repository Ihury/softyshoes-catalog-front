"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EtiquetaChip } from "@/components/ui/Chip";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronRight } from "@/components/icons";
import { principalEtiqueta } from "@/lib/etiquetas";
import { brl } from "@/lib/format";
import type { Banner, CatalogItem, HeroMode } from "@/lib/types";

/** How long a slide rests before the next one comes in. */
const AUTOPLAY_MS = 10_000;
/** How long autoplay stays out of the way after someone touches the carousel. */
const RESUME_MS = 12_000;
/** Matches the `gap-3` between slides, which the scroll maths has to account for. */
const GAP = 12;

type Slide =
  | { kind: "banner"; banner: Banner }
  | { kind: "featured"; product: CatalogItem };

function slideKey(s: Slide) {
  return s.kind === "banner" ? `b-${s.banner.id}` : `f-${s.product.id}`;
}

/**
 * The home highlight.
 *
 * Shows the seller's banners, the featured model, or both — `heroMode` decides,
 * and with no banners at all it always falls back to the model, so the slot is
 * never empty. More than one slide turns it into a carousel: drag, snap, and an
 * unhurried auto-advance that steps aside for twelve seconds whenever someone
 * takes hold of it.
 */
export function HomeHero({
  banners,
  featured,
  heroMode,
}: {
  banners: Banner[];
  featured: CatalogItem | null;
  heroMode: HeroMode;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const pausedUntil = useRef(0);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = banners.map((banner) => ({ kind: "banner" as const, banner }));
  // The model keeps the slot when there is nothing else in it, and shares it
  // when the seller asked for both.
  if (featured && (slides.length === 0 || heroMode === "both")) {
    slides.push({ kind: "featured", product: featured });
  }

  const count = slides.length;

  const slideTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const step = el.clientWidth + GAP;
    el.scrollTo({ left: i * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const el = track.current;
      if (!el) return;
      const step = el.clientWidth + GAP;
      const next = (Math.round(el.scrollLeft / step) + 1) % count;
      el.scrollTo({ left: next * step, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const step = Math.max(1, el.clientWidth + GAP);
    const i = Math.round(el.scrollLeft / step);
    if (i !== index) setIndex(i);
  };

  // Pointer drag, for a mouse. Touch already scrolls the track natively, and
  // hijacking it there would fight the browser's own momentum.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pausedUntil.current = Date.now() + RESUME_MS;
    if (e.pointerType === "touch") return;
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
    const move = (ev: PointerEvent) => {
      el.scrollLeft = startLeft - (ev.clientX - startX);
    };
    const up = () => {
      el.style.cursor = "grab";
      el.style.scrollSnapType = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const step = el.clientWidth + GAP;
      slideTo(Math.round(el.scrollLeft / step));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex-none" style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both" }}>
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory cursor-grab"
        style={{ touchAction: "pan-x pan-y" }}
      >
        {slides.map((slide) => (
          <div
            key={slideKey(slide)}
            className="flex-none w-full snap-center relative h-[180px] md:h-[340px] rounded-ui overflow-hidden bg-ink-10"
          >
            {slide.kind === "featured" ? (
              <FeaturedSlide product={slide.product} />
            ) : (
              <BannerSlide banner={slide.banner} />
            )}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={`dot-${slideKey(slide)}`}
              type="button"
              aria-label={`Ir para o destaque ${i + 1}`}
              onClick={() => {
                pausedUntil.current = Date.now() + RESUME_MS;
                slideTo(i);
              }}
              className="h-4 w-4 flex items-center justify-center"
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-transform duration-200 ${
                  i === index ? "bg-ink scale-135" : "bg-ink-25"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const hasImage = !!banner.image_url;
  return (
    <>
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* The scrim is what keeps the caption legible over an arbitrary photo
              the seller uploaded, whatever is in its lower third. */}
          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[rgba(9,9,9,.55)] to-transparent" />
        </>
      ) : null}
      {banner.tag ? (
        <span className="absolute top-4 left-4 md:top-6 md:left-6">
          <EtiquetaChip name={banner.tag.name} style={banner.tag.style} />
        </span>
      ) : null}
      <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:bottom-6 md:max-w-[420px] flex flex-col gap-1">
        <span className={`text-md ${hasImage ? "text-paper" : "text-ink"}`}>{banner.title}</span>
        {banner.subtitle ? (
          <span className={`text-xs ${hasImage ? "text-paper-50" : "text-ink-50"}`}>
            {banner.subtitle}
          </span>
        ) : null}
      </div>
    </>
  );
}

function FeaturedSlide({ product }: { product: CatalogItem }) {
  const chip = principalEtiqueta(product.etiquetas, product.promotion, "hero");
  return (
    <Link
      href={`/produto/${product.slug}`}
      prefetch
      className="block absolute inset-0 text-left transition-transform duration-200 active:scale-[.985]"
    >
      <ProductImage
        src={product.photos?.[0]}
        alt={product.name}
        className="absolute inset-0"
        sizes="(min-width: 1280px) 1184px, 100vw"
        priority
      />
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <EtiquetaChip name={chip.name} style={chip.style} />
      </div>
      <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:bottom-6 md:max-w-[420px] px-3 py-2 bg-paper-50 backdrop-blur-[20px] rounded-ui flex items-center gap-3 md:gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
            {product.name}
          </div>
          <div className="flex items-baseline gap-2 text-xs whitespace-nowrap">
            <span className="text-ink-50">{brl(product.price)} un.</span>
            {product.old_price ? (
              <span className="text-ink-25 line-through">{brl(product.old_price)}</span>
            ) : null}
          </div>
        </div>
        <IconChevronRight className="text-ink-50" />
      </div>
    </Link>
  );
}
