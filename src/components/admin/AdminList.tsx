"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import { IconChevronDown } from "@/components/icons";
import { moveProduct } from "@/lib/actions";
import { brl } from "@/lib/format";
import type { Brand, Filter, ProductEtiqueta } from "@/lib/types";

/**
 * Exactly what a listing row draws — no description, no spec, no photo array.
 * The rows are filtered in the browser now, so this shape crosses the wire to
 * the client and every field it does not need is paid for 59 times over.
 *
 * The three flags are here because the tabs filter by rule: without
 * `promotion` the "Promoção" tab would quietly show nothing.
 */
export type AdminRow = {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  photo: string | null;
  brand: { name: string } | null;
  sizeCount: number;
  status: string;
  promotion: boolean;
  available: boolean;
  ordered: boolean;
  featured: boolean;
  etiquetas: ProductEtiqueta[];
};

/** Shared by the header and the rows so the columns cannot drift apart. */
const COLUMNS = "40px 96px minmax(140px,2fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) 74px";

/**
 * The admin catalog listing.
 *
 * Filtering happens here rather than in Postgres. The whole catalog is a few
 * dozen rows, so shipping it once and narrowing it in the browser turns every
 * tab, brand and search into an instant local operation instead of a round
 * trip to a serverless function and back.
 */
export function AdminList({
  rows,
  brands,
  filters,
}: {
  rows: AdminRow[];
  brands: Brand[];
  filters: Filter[];
}) {
  const { match } = useCatalogFilter();
  const router = useRouter();
  const [pending, startMove] = useTransition();
  /** The row being moved, so only its own arrows go quiet. */
  const [moving, setMoving] = useState<string | null>(null);
  const shown = match(rows);

  /**
   * Swaps a model with the row next to it *on screen*.
   *
   * The neighbour is taken from the filtered list, so an arrow does what it
   * looks like it does even when a tab is on: the model lands above the row
   * drawn above it, however far apart the two are in the stored order.
   *
   * The refresh is the point. The action revalidates on the server, but the
   * listing is a client tree holding rows it was handed once — without asking
   * the router for them again the new order only appeared on a manual reload.
   */
  const move = (id: string, neighbour: AdminRow | undefined) => {
    if (!neighbour) return;
    setMoving(id);
    startMove(async () => {
      await moveProduct(id, neighbour.id);
      router.refresh();
      setMoving(null);
    });
  };

  return (
    <>
      <AdminListControls
        brands={brands}
        filters={filters}
        countLabel={`${shown.length} ${shown.length === 1 ? "modelo" : "modelos"}`}
      />

      {/* Column headings only when there are rows to head. */}
      {shown.length > 0 ? (
        <div
          className="hidden md:grid gap-4 mt-6 pb-3 border-b border-ink-10 text-xs text-ink-50"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <div>#</div>
          <div>Foto</div>
          <div>Modelo</div>
          <div>Marca</div>
          <div>Preço</div>
          <div>Num.</div>
          <div>Ordem</div>
        </div>
      ) : null}

      <div className="mt-5 md:mt-0 flex-1 flex flex-col">
        {shown.map((r, i) => {
          const pos = rows.findIndex((x) => x.id === r.id);
          return (
            // One row for both breakpoints. Rendering a phone list and a desktop
            // table separately meant every model shipped twice, images included,
            // with half of them permanently display:none.
            <div
              key={r.id}
              className="relative py-4 border-b border-ink-03 flex items-start gap-4 md:grid md:items-center md:gap-4"
              style={{
                gridTemplateColumns: COLUMNS,
                animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both",
                animationDelay: `${0.05 * Math.min(i, 7)}s`,
              }}
            >
              {/* The link covers the row rather than wrapping it: the reorder
                  arrows sit inside the same row and must not be swallowed by
                  an anchor. */}
              <Link
                href={`/admin/produtos/${r.id}`}
                aria-label={`Editar ${r.name}`}
                className="absolute inset-0 z-0 transition-opacity hover:opacity-60"
              />

              <div className="hidden md:block relative z-10 pointer-events-none text-xs text-ink-25 tabular-nums">
                {String(pos + 1).padStart(2, "0")}
              </div>

              <div className="relative z-10 pointer-events-none flex-none">
                <ProductImage
                  src={r.photo}
                  alt={r.name}
                  className="relative w-[76px] h-[76px] md:w-24 md:h-[72px]"
                  sizes="96px"
                />
              </div>

              <div className="relative z-10 pointer-events-none flex-1 min-w-0 flex flex-col gap-1">
                <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                  {r.name}
                </div>
                <div className="md:hidden text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                  {brl(r.price)} un.
                </div>
                <div className="md:hidden text-xs text-ink-25 whitespace-nowrap overflow-hidden text-ellipsis">
                  {String(pos + 1).padStart(2, "0")} · {r.brand?.name ?? "Sem marca"} · {r.sizeCount}{" "}
                  numerações
                </div>
                <div className="hidden md:flex gap-2 text-xs text-ink-50">
                  {r.featured ? <span>Destaque na home</span> : null}
                  {r.etiquetas.length ? (
                    <span className="text-ink-25 truncate">
                      {r.etiquetas.map((e) => e.name).join(" · ")}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="hidden md:block relative z-10 pointer-events-none text-xs text-ink-50">
                {r.brand?.name ?? "—"}
              </div>
              <div className="hidden md:flex relative z-10 pointer-events-none flex-col gap-1">
                <div className="text-sm">{brl(r.price)}</div>
                {r.old_price ? (
                  <div className="text-xs text-ink-25 line-through">{brl(r.old_price)}</div>
                ) : null}
              </div>
              <div className="hidden md:flex relative z-10 pointer-events-none flex-col gap-1">
                <span className="text-xs text-ink-50">{r.sizeCount} num.</span>
                {r.status ? <span className="text-xs text-ink-25">{r.status}</span> : null}
              </div>

              <div className="relative z-10 flex-none flex flex-col items-end gap-1 md:flex-row md:items-center md:justify-end md:gap-1">
                {r.status ? (
                  <span className="md:hidden text-xs text-ink-50">{r.status}</span>
                ) : null}
                {r.featured ? (
                  <span className="md:hidden text-xs text-ink font-normal">Destaque</span>
                ) : null}
                <div className="flex items-center gap-1">
                  <MoveButton
                    label={`Subir ${r.name}`}
                    up
                    disabled={i === 0 || (pending && moving === r.id)}
                    onClick={() => move(r.id, shown[i - 1])}
                  />
                  <MoveButton
                    label={`Descer ${r.name}`}
                    disabled={i === shown.length - 1 || (pending && moving === r.id)}
                    onClick={() => move(r.id, shown[i + 1])}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {shown.length === 0 ? (
          // Centred in what is left below the controls, matching the storefront.
          <div className="flex-1 flex items-center justify-center py-12 md:py-24 text-center text-sm text-ink-50">
            Nenhum modelo encontrado.
          </div>
        ) : null}
      </div>
    </>
  );
}

function MoveButton({
  label,
  up = false,
  disabled,
  onClick,
}: {
  label: string;
  up?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-ink-25 transition-opacity hover:opacity-60 disabled:opacity-25 disabled:pointer-events-none"
    >
      <IconChevronDown className={up ? "rotate-180" : ""} />
    </button>
  );
}
