"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import { brl } from "@/lib/format";
import type { Brand, Tag } from "@/lib/types";

/**
 * Exactly what a listing row draws — no description, no spec, no photo array.
 * The rows are filtered in the browser now, so this shape crosses the wire to
 * the client and every field it does not need is paid for 38 times over.
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
  featured: boolean;
  tag_ids: string[];
};

/** Shared by the header and the rows so the columns cannot drift apart. */
const COLUMNS = "96px minmax(0,2fr) 120px 160px 120px 120px";

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
  tags,
}: {
  rows: AdminRow[];
  brands: Brand[];
  tags: Tag[];
}) {
  const { match } = useCatalogFilter();
  const shown = match(rows);

  return (
    <>
      <AdminListControls
        brands={brands}
        tags={tags}
        countLabel={`${shown.length} ${shown.length === 1 ? "modelo" : "modelos"}`}
      />

      {/* Column headings only when there are rows to head. */}
      {shown.length > 0 ? (
        <div
          className="hidden md:grid gap-4 mt-6 pb-3 border-b border-ink-10 text-xs text-ink-50"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <div>Foto</div>
          <div>Modelo</div>
          <div>Marca</div>
          <div>Preço</div>
          <div>Numerações</div>
          <div>Status</div>
        </div>
      ) : null}

      <div className="mt-5 md:mt-0 flex-1 flex flex-col">
        {shown.map((r, i) => (
          // One row for both breakpoints. Rendering a phone list and a desktop
          // table separately meant every model shipped twice, images included,
          // with half of them permanently display:none.
          <Link
            key={r.id}
            href={`/admin/produtos/${r.id}`}
            className="py-4 border-b border-ink-03 flex items-start gap-4 md:grid md:items-center md:gap-4 transition-opacity hover:opacity-[.62]"
            style={{
              gridTemplateColumns: COLUMNS,
              animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both",
              animationDelay: `${0.05 * Math.min(i, 7)}s`,
            }}
          >
            <ProductImage
              src={r.photo}
              alt={r.name}
              className="relative flex-none w-[76px] h-[76px] md:w-24 md:h-[72px]"
              sizes="96px"
            />

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {r.name}
              </div>
              <div className="md:hidden text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                {brl(r.price)} un.
              </div>
              <div className="md:hidden text-xs text-ink-25 whitespace-nowrap overflow-hidden text-ellipsis">
                {r.brand?.name ?? "Sem marca"} · {r.sizeCount} numerações
              </div>
              {r.featured ? (
                <div className="hidden md:block text-xs text-ink-50">Destaque na home</div>
              ) : null}
            </div>

            <div className="hidden md:block text-xs text-ink-50">{r.brand?.name ?? "—"}</div>
            <div className="hidden md:flex flex-col gap-1">
              <div className="text-sm">{brl(r.price)}</div>
              {r.old_price ? (
                <div className="text-xs text-ink-25 line-through">{brl(r.old_price)}</div>
              ) : null}
            </div>
            <div className="hidden md:block text-xs text-ink-50">{r.sizeCount} numerações</div>

            <div className="flex-none flex flex-col items-end gap-1 md:items-start">
              <span className="text-xs text-ink-50">{r.status}</span>
              {r.featured ? (
                <span className="md:hidden text-xs text-ink font-normal">Destaque</span>
              ) : null}
            </div>
          </Link>
        ))}

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
