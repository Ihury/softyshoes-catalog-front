"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconMenu } from "@/components/icons";
import { CatalogFilterProvider } from "@/components/client/CatalogFilter";
import { Sheet } from "@/components/ui/Sheet";
import { signOut } from "@/lib/actions";
import type { Filter } from "@/lib/types";

/** The catalog sits on its own; everything below it configures what the
 *  catalog is made of. On a phone the second group lives behind "Ajustes". */
const MAIN = [{ href: "/admin", label: "Catálogo" }];

const SETTINGS = [
  { href: "/admin/etiquetas", label: "Etiquetas" },
  { href: "/admin/numeracoes", label: "Numerações" },
  { href: "/admin/filtros", label: "Filtros" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/site", label: "Site e banners" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/vendedor", label: "Contato do vendedor" },
];

const NAV = [...MAIN, ...SETTINGS];

export function AdminShell({
  children,
  productCount,
  sellerReady,
  filters,
}: {
  children: React.ReactNode;
  productCount: number;
  sellerReady: boolean;
  filters: Filter[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isList = pathname === "/admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The listing filters in the browser, exactly like the storefront, so a tab
  // or a search never leaves the page. It searches wider than the storefront
  // does, matching the brand and the etiquetas as well as the name.
  return (
    <CatalogFilterProvider filters={filters} basePath="/admin" searchScope="wide">
      <div className="min-h-dvh flex flex-col md:grid md:grid-cols-[clamp(190px,20vw,264px)_minmax(0,1fr)]">
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
                  className="h-10 flex items-center justify-between gap-2 text-sm text-ink-50 transition-opacity hover:opacity-60"
                >
                  {on ? (
                    <span className="text-ink font-normal truncate">{n.label}</span>
                  ) : (
                    <span className="truncate">{n.label}</span>
                  )}
                  {on ? <IconChevronRight className="flex-none text-ink" /> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            {/* Not in the handoff — the prototype had no real login — but the
                panel is behind auth, so it needs a way out. */}
            <form action={signOut}>
              <button
                type="submit"
                className="h-10 text-xs text-ink-50 transition-opacity hover:opacity-60"
              >
                Sair
              </button>
            </form>
            <div className="text-xs text-ink-50">{productCount} modelos no catálogo</div>
            <div className="text-xs text-ink-25">Selecionado SOFTY.</div>
          </div>
        </aside>

        {/* flex-1 fills the column on mobile; on desktop the grid row already
            stretches. Either way the page below can centre an empty state in
            whatever height is left. */}
        <div className="min-w-0 flex-1 flex flex-col">
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
                  className="absolute left-[clamp(16px,5vw,24px)] top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-50 transition-opacity hover:opacity-60 active:scale-95"
                >
                  <IconChevronLeft />
                </Link>
              ) : (
                // Every configuration screen used to be desktop-only in
                // practice: the phone had no way to reach them.
                <button
                  type="button"
                  aria-label="Ajustes"
                  onClick={() => setSettingsOpen(true)}
                  className="absolute left-[clamp(16px,5vw,24px)] top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-50 transition-opacity hover:opacity-60 active:scale-95"
                >
                  <IconMenu />
                </button>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-xl leading-none font-normal">SOFTY</span>
                <span className="text-xs text-ink-50">Admin</span>
              </div>
              {isList ? (
                <Link
                  href="/admin/vendedor"
                  className="absolute right-[clamp(16px,5vw,24px)] top-1/2 -translate-y-1/2 h-10 flex items-center text-xs transition-transform active:scale-95"
                >
                  <span className={sellerReady ? "text-ink font-normal" : "text-ink-25"}>
                    Contato
                  </span>
                </Link>
              ) : null}
            </div>
          </div>

          {children}
        </div>
      </div>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="w-9 h-0.5 bg-ink-10 mx-auto mb-5 md:hidden" />
        <div className="text-xs text-ink-50">Ajustes</div>
        <div className="mt-1 flex flex-col">
          {SETTINGS.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setSettingsOpen(false)}
              className="h-10 flex items-center justify-between text-md text-ink-50 transition-opacity hover:opacity-60"
              style={{
                animation: "sfRow .3s cubic-bezier(.22,1,.36,1) both",
                animationDelay: `${i * 34}ms`,
              }}
            >
              <span>{n.label}</span>
              <IconChevronRight />
            </Link>
          ))}
        </div>
        <form action={signOut} className="mt-3 border-t border-ink-03 pt-3">
          <button type="submit" className="h-10 text-xs text-ink-50 transition-opacity hover:opacity-60">
            Sair
          </button>
        </form>
      </Sheet>
    </CatalogFilterProvider>
  );
}
