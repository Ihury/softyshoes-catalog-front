"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Catálogo" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/vendedor", label: "Contato do vendedor" },
];

export function AdminShell({
  children,
  productCount,
  sellerReady,
}: {
  children: React.ReactNode;
  productCount: number;
  sellerReady: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isList = pathname === "/admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[264px_minmax(0,1fr)]">
      {/* desktop sidebar */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-dvh border-r border-ink-10 px-6 pt-6 pb-8 flex-col gap-8">
        <div className="flex items-baseline gap-2">
          <span className="text-xl leading-none font-normal">SOFTY</span>
          <span className="text-xs text-ink-50">Admin</span>
        </div>
        <nav className="flex flex-col">
          {NAV.map((n) => {
            const on = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="h-10 flex items-center justify-between text-sm text-ink-50 transition-colors hover:text-ink"
              >
                {on ? <span className="text-ink font-normal">{n.label}</span> : <span>{n.label}</span>}
                {on ? <IconChevronRight className="text-ink" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <div className="text-xs text-ink-50">{productCount} modelos no catálogo</div>
          <div className="text-xs text-ink-25">Selecionado SOFTY.</div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* mobile header */}
        <div className="md:hidden sticky top-0 z-20">
          <div
            className={`relative h-[58px] flex items-center justify-center transition-colors ${
              scrolled ? "bg-paper-50 backdrop-blur-[18px] border-b border-ink-03" : ""
            }`}
          >
            {!isList ? (
              <Link
                href="/admin"
                aria-label="Voltar"
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-50 transition-colors hover:text-ink active:scale-95"
              >
                <IconChevronLeft />
              </Link>
            ) : null}
            <div className="flex items-baseline gap-2">
              <span className="text-xl leading-none font-normal">SOFTY</span>
              <span className="text-xs text-ink-50">Admin</span>
            </div>
            {isList ? (
              <Link
                href="/admin/vendedor"
                className="absolute right-6 top-1/2 -translate-y-1/2 h-10 flex items-center text-xs transition-transform active:scale-95"
              >
                <span className={sellerReady ? "text-ink font-normal" : "text-ink-25"}>Contato</span>
              </Link>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
