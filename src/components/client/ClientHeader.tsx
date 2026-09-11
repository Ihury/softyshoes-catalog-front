"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronDown, IconCart } from "@/components/icons";
import { useCart } from "@/components/client/CartProvider";
import { BrandSheet } from "@/components/client/BrandSheet";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import type { Brand } from "@/lib/types";

/** The handoff pairs a 16x16 cart glyph with the word "Carrinho", ink when the
 *  cart has something in it and ink-25 when it is empty. The model count rides
 *  on the glyph's top-right corner and caps at "9+", so a full cart never
 *  widens the header. */
function CartLabel({ count }: { count: number }) {
  const filled = count > 0;
  return (
    <>
      {/* The badge is absolutely placed, so the reserved right margin — not the
          badge itself — is what keeps it clear of the word beside it. */}
      <span className={`relative flex-none ${filled ? "mr-2" : ""}`}>
        <IconCart className={filled ? "text-ink" : "text-ink-25"} />
        {filled ? (
          <span
            key={count}
            className="absolute -top-1.5 left-full -translate-x-1 text-[10px] leading-none text-ink font-normal tabular-nums"
            style={{ animation: "sfPop .2s ease both" }}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </span>
      <span className={filled ? "text-ink font-normal" : "text-ink-25"}>Carrinho</span>
    </>
  );
}

function cartLabel(count: number) {
  if (count === 0) return "Abrir carrinho, vazio";
  return `Abrir carrinho, ${count} ${count === 1 ? "modelo" : "modelos"}`;
}

export function ClientHeader({ brands }: { brands: Brand[] }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { filters, apply } = useCatalogFilter();
  const [scrolled, setScrolled] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);

  // Mirrors the URL-owned search back into the field — see CatalogControls.
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (syncedQuery !== filters.q) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
  }

  const showBack = pathname !== "/";
  const showCart = pathname !== "/carrinho";
  const activeBrand = filters.brand;

  useEffect(() => {
    // Only re-render when the flag actually flips, not on every scroll frame.
    let on = false;
    const onScroll = () => {
      const next = window.scrollY > 6;
      if (next === on) return;
      on = next;
      setScrolled(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = query.trim();
    apply({ q: v.length >= 2 ? v : "" });
  }

  return (
    <>
      <div className="sticky top-0 z-20">
        {/* mobile bar */}
        <div
          className={`md:hidden relative h-[58px] flex items-center justify-center transition-colors ${
            scrolled ? "bg-paper-50 backdrop-blur-[18px] border-b border-ink-03" : ""
          }`}
        >
          {showBack ? (
            <Link
              href="/"
              aria-label="Voltar"
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-50 transition-colors hover:text-ink active:scale-95"
            >
              <IconChevronLeft />
            </Link>
          ) : null}
          <span className="text-xl leading-none font-normal text-ink">SOFTY</span>
          {showCart ? (
            <Link
              href="/carrinho"
              aria-label={cartLabel(count)}
              className="absolute right-6 top-1/2 -translate-y-1/2 h-10 flex items-center gap-2 text-xs transition-transform active:scale-95"
            >
              <CartLabel count={count} />
            </Link>
          ) : null}
        </div>

        {/* desktop bar */}
        <div className="hidden md:block bg-paper-50 backdrop-blur-[18px] border-b border-ink-03">
          <div className="max-w-[1280px] mx-auto px-12 py-5 flex items-center gap-8">
            <Link href="/" className="flex-none flex items-baseline gap-2 transition-opacity hover:opacity-60">
              <span className="text-xl leading-none font-normal">SOFTY</span>
              <span className="text-xs text-ink-50">Essential Footwear</span>
            </Link>
            <form onSubmit={onSearchSubmit} className="flex-1 min-w-0 flex justify-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar modelo"
                aria-label="Buscar modelo"
                className="flex-1 max-w-[420px] min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
              />
              <button
                type="button"
                onClick={() => setBrandOpen(true)}
                className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-opacity hover:opacity-[.86] active:scale-[.97]"
              >
                <span>{activeBrand === "Todas" ? "Marca" : activeBrand}</span>
                <IconChevronDown stroke="#FAFAFA" />
              </button>
            </form>
            <Link
              href="/carrinho"
              aria-label={cartLabel(count)}
              className="flex-none h-10 flex items-center gap-2 text-sm transition-opacity hover:opacity-60"
            >
              <CartLabel count={count} />
            </Link>
          </div>
        </div>
      </div>

      <BrandSheet
        open={brandOpen}
        onClose={() => setBrandOpen(false)}
        brands={brands}
        activeBrand={activeBrand}
        onSelect={(brand) => {
          setBrandOpen(false);
          apply({ brand });
        }}
      />
    </>
  );
}
