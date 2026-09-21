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

  const current = slides[Math.min(index, count - 1)];
  const onImage = current
    ? current.kind === "featured"
      ? !!current.product.photos?.[0]
      : !!current.banner.image_url
    : false;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const step = Math.max(1, el.clientWidth + GAP);
    const i = Math.round(el.scrollLeft / step);
    if (i !== index) setIndex(i);
  };

  return (
    <div
      className="flex-none relative"
      style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both" }}
    >
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={() => {
          pausedUntil.current = Date.now() + RESUME_MS;
        }}
        className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory"
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
        // Over the slot at its foot, not in a strip beneath it — 4px dots,
        // 5px apart, the active one at 1.35, exactly as the handoff draws them.
        // They read light over a photo and dark over an empty banner, which is
        // why the colour follows the slide rather than being fixed.
        <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-[5px]">
          {slides.map((slide, i) => (
            <button
              key={`dot-${slideKey(slide)}`}
              type="button"
              aria-label={`Ir para o destaque ${i + 1}`}
              aria-current={i === index}
              onClick={() => {
                pausedUntil.current = Date.now() + RESUME_MS;
                slideTo(i);
              }}
              // The dot is 4px; the button around it is a real touch target.
              className="w-5 h-5 flex items-center justify-center"
            >
              <span
                className={`block w-1 h-1 rounded-full transition-[background-color,transform] duration-300 ${
                  onImage
                    ? i === index
                      ? "bg-paper scale-135"
                      : "bg-paper-50"
                    : i === index
                      ? "bg-ink scale-135"
                      : "bg-ink-25"
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
      // Opts out of the global `a:hover` fade: on a photo this wide, dropping
      // the whole slot to 60% reads as the image graying out, not as a link
      // acknowledging the pointer. The press still answers with a scale.
      className="block absolute inset-0 text-left transition-transform duration-200 hover:opacity-100 active:scale-[.985]"
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
