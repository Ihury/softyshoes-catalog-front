import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrands, getFilters } from "@/lib/data";
import { AdminList, type AdminRow } from "@/components/admin/AdminList";
import { asList, normalizeEtiquetas } from "@/lib/types";
import type { Product } from "@/lib/types";

// Deliberately uncached: whoever just saved has to see the result.
export const dynamic = "force-dynamic";

/** Only the columns a row draws. `description` and `spec` are long free text
 *  the listing never shows, and they were being read for every model.
 *
 *  `promotion` is here because the tabs filter by rule now: without it the
 *  "Promoção" tab would show an empty list and never say why. */
const ROW_COLUMNS =
  "id,name,price,old_price,photos,sizes,promotion,available,ordered,featured,position," +
  "brand:brands(name),product_tags(position,tag:tags(id,name,style))";

type Row = Pick<
  Product,
  "id" | "name" | "price" | "old_price" | "promotion" | "available" | "ordered" | "featured"
> & {
  photos: unknown;
  sizes: unknown;
  brand: { name: string } | null;
  product_tags: unknown;
};

export default async function AdminListPage() {
  const supabase = await createClient();
  const [brands, filters, { data }] = await Promise.all([
    getBrands(),
    getFilters(),
    // No filtering here any more: the whole list ships once and the browser
    // narrows it, so a tab or a search costs no request at all. The order is
    // the seller's own, the same one the storefront shows.
    supabase
      .from("products")
      .select(ROW_COLUMNS)
      .order("position")
      .order("created_at", { ascending: false }),
  ]);

  // "Publicado" and "Pausado" are gone at the client's request: they read as a
  // promise the site does not keep, since an unavailable model still shows in
  // the catalog's "Todos" tab. The Disponível switch on the edit screen is
  // where that state is set and read now.
  //
  // "Pedidos" stays, and still only when a filter uses the rule — it names
  // something a row genuinely is, rather than a publication state. An empty
  // string means the row has nothing to say, and neither column draws.
  const showsPedidos = filters.some((f) => f.rule === "ped");
  const statusOf = (p: Row) => (showsPedidos && p.ordered ? "Pedidos" : "");

  const rows: AdminRow[] = asList<Row>(data).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    old_price: p.old_price,
    photo: asList<string>(p.photos)[0] ?? null,
    brand: p.brand ?? null,
    sizeCount: asList<number>(p.sizes).length,
    status: statusOf(p),
    promotion: p.promotion,
    available: p.available,
    ordered: p.ordered,
    featured: p.featured,
    etiquetas: normalizeEtiquetas(p.product_tags),
  }));

  return (
    <div className="flex-1 min-w-0 flex flex-col px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14">
      <AdminList rows={rows} brands={brands} filters={filters} />

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex justify-center pointer-events-none">
        <Link
          href="/admin/produtos/novo"
          className="pointer-events-auto h-10 min-w-[116px] px-3 rounded-ui bg-[rgba(9,9,9,0.5)] backdrop-blur-[20px] text-paper text-sm font-normal flex items-center justify-center transition-[opacity,transform] hover:opacity-80 active:scale-[.97]"
        >
          Novo modelo
        </Link>
      </div>
    </div>
  );
}
