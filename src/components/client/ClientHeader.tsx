"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronDown } from "@/components/icons";
import { useCart } from "@/components/client/CartProvider";
import { BrandSheet } from "@/components/client/BrandSheet";
import { useFilterNavigation } from "@/components/client/FilterNavigation";
import type { Brand } from "@/lib/types";

export function ClientHeader({ brands }: { brands: Brand[] }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { filters, apply } = useFilterNavigation();
  const [scrolled, setScrolled] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);

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
              aria-label="Abrir carrinho"
              className="absolute right-6 top-1/2 -translate-y-1/2 h-10 flex items-center text-xs transition-transform active:scale-95"
            >
              <span className={count > 0 ? "text-ink font-normal" : "text-ink-25"}>Carrinho</span>
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
              className="flex-none h-10 flex items-center gap-2 text-sm transition-opacity hover:opacity-60"
            >
              <span className={count > 0 ? "text-ink font-normal" : "text-ink-25"}>Carrinho</span>
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
