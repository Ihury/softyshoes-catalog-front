import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrands, getTags } from "@/lib/data";
import { AdminList, type AdminRow } from "@/components/admin/AdminList";
import { asList } from "@/lib/types";
import type { Product } from "@/lib/types";

// Deliberately uncached: whoever just saved has to see the result.
export const dynamic = "force-dynamic";

/** Only the columns a row draws. `description` and `spec` are long free text
 *  the listing never shows, and they were being read for every model. */
const ROW_COLUMNS =
  "id,name,price,old_price,photos,sizes,available,ordered,featured,brand:brands(name),product_tags(tag_id)";

type Row = Pick<
  Product,
  "id" | "name" | "price" | "old_price" | "available" | "ordered" | "featured"
> & {
  photos: unknown;
  sizes: unknown;
  brand: { name: string } | null;
  product_tags: { tag_id: string }[] | null;
};

export default async function AdminListPage() {
  const supabase = await createClient();
  const [brands, tags, { data }] = await Promise.all([
    getBrands(),
    getTags(),
    // No filtering here any more: the whole list ships once and the browser
    // narrows it, so a tab or a search costs no request at all.
    supabase.from("products").select(ROW_COLUMNS).order("created_at", { ascending: false }),
  ]);

  const rows: AdminRow[] = asList<Row>(data).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    old_price: p.old_price,
    photo: asList<string>(p.photos)[0] ?? null,
    brand: p.brand ?? null,
    sizeCount: asList<number>(p.sizes).length,
    status: p.ordered ? "Pedidos" : p.available ? "Publicado" : "Pausado",
    featured: p.featured,
    tag_ids: asList<{ tag_id: string }>(p.product_tags).map((t) => t.tag_id),
  }));

  return (
    <div className="flex-1 min-w-0 flex flex-col px-6 md:px-10 md:pt-8 pb-[82px] md:pb-14">
      <AdminList rows={rows} brands={brands} tags={tags} />

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex justify-center pointer-events-none">
        <Link
          href="/admin/produtos/novo"
          className="pointer-events-auto h-10 min-w-[116px] px-3 rounded-ui bg-[rgba(9,9,9,0.5)] backdrop-blur-[20px] text-paper text-sm font-normal flex items-center justify-center transition-[background-color,transform] hover:bg-ink active:scale-[.97]"
        >
          Novo modelo
        </Link>
      </div>
    </div>
  );
}
