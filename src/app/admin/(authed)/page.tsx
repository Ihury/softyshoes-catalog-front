import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrands } from "@/lib/data";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { ProductImage } from "@/components/ui/ProductImage";
import { brl } from "@/lib/format";
import type { Product, Tab } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; brand?: string; q?: string }>;
}) {
  const { tab, brand, q } = await searchParams;
  const activeTab = (tab as Tab) ?? "Todos";

  const supabase = await createClient();
  let query = supabase.from("products").select("*, brand:brands(*)").order("created_at", { ascending: false });

  if (activeTab === "Promoção") query = query.eq("promotion", true);
  if (activeTab === "Disponíveis") query = query.eq("available", true);
  if (activeTab === "Pedidos") query = query.eq("ordered", true);
  if (q && q.trim().length >= 2) query = query.ilike("name", `%${q.trim()}%`);

  const [{ data: productsRaw }, brands] = await Promise.all([query, getBrands()]);
  const products = ((productsRaw as Product[]) ?? []).filter((p) => (brand ? p.brand?.name === brand : true));

  function statusLabel(p: Product) {
    if (p.ordered) return "Pedidos";
    return p.available ? "Publicado" : "Pausado";
  }

  return (
    <div className="px-6 md:px-10 pt-6 md:pt-8 pb-24 md:pb-14">
      <AdminListControls brands={brands} countLabel={`${products.length} modelos`} />

      {/* mobile rows */}
      <div className="mt-5 md:hidden flex flex-col">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/admin/produtos/${p.id}`}
            className="py-4 border-b border-ink-03 flex items-start gap-4 transition-opacity hover:opacity-[.62]"
            style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both", animationDelay: `${0.05 * Math.min(i, 7)}s` }}
          >
            <ProductImage src={p.photos?.[0]} alt={p.name} className="flex-none w-[76px] h-[76px]" />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {p.name}
              </div>
              <div className="text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                {brl(p.price)} un.
              </div>
              <div className="text-xs text-ink-25 whitespace-nowrap overflow-hidden text-ellipsis">
                {p.brand?.name ?? "Sem marca"} · {p.sizes.length} numerações
              </div>
            </div>
            <div className="flex-none flex flex-col items-end gap-1">
              <span className="text-xs text-ink-50">{statusLabel(p)}</span>
              {p.featured ? <span className="text-xs text-ink font-normal">Destaque</span> : null}
            </div>
          </Link>
        ))}
      </div>

      {/* desktop table */}
      <div className="hidden md:block mt-6">
        <div
          className="grid gap-4 pb-3 border-b border-ink-10 text-xs text-ink-50"
          style={{ gridTemplateColumns: "96px minmax(0,2fr) 120px 160px 120px 120px" }}
        >
          <div>Foto</div>
          <div>Modelo</div>
          <div>Marca</div>
          <div>Preço</div>
          <div>Numerações</div>
          <div>Status</div>
        </div>
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/admin/produtos/${p.id}`}
            className="w-full grid gap-4 items-center py-4 border-b border-ink-03 text-left transition-opacity hover:opacity-[.62]"
            style={{
              gridTemplateColumns: "96px minmax(0,2fr) 120px 160px 120px 120px",
              animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both",
              animationDelay: `${0.05 * Math.min(i, 7)}s`,
            }}
          >
            <ProductImage src={p.photos?.[0]} alt={p.name} className="w-24 h-[72px]" />
            <div className="min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
              {p.featured ? <div className="text-xs text-ink-50">Destaque na home</div> : null}
            </div>
            <div className="text-xs text-ink-50">{p.brand?.name ?? "—"}</div>
            <div className="flex flex-col gap-1">
              <div className="text-sm">{brl(p.price)}</div>
              {p.old_price ? <div className="text-xs text-ink-25 line-through">{brl(p.old_price)}</div> : null}
            </div>
            <div className="text-xs text-ink-50">{p.sizes.length}</div>
            <div className="text-xs text-ink-50">{statusLabel(p)}</div>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="py-12 md:py-24 text-center text-sm text-ink-50">Nenhum modelo encontrado.</div>
      ) : null}

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
