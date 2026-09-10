import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrands, getFeaturedProduct } from "@/lib/data";
import { CatalogControls } from "@/components/client/CatalogControls";
import { ProductCard } from "@/components/client/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronRight } from "@/components/icons";
import { brl } from "@/lib/format";
import type { Product, Tab } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
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

  const [{ data: productsRaw }, brands, featured] = await Promise.all([
    query,
    getBrands(),
    getFeaturedProduct(),
  ]);

  const products = ((productsRaw as Product[]) ?? []).filter((p) =>
    brand ? p.brand?.name === brand : true
  );

  const empty = products.length === 0;

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 pt-6 md:pt-8 pb-6 md:pb-14">
      {featured ? (
        <Link
          href={`/produto/${featured.id}`}
          className="block w-full text-left relative h-[223px] md:h-[440px] rounded-r md:rounded-none overflow-hidden transition-transform duration-200 active:scale-[.985]"
          style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both" }}
        >
          <ProductImage src={featured.photos?.[0]} alt={featured.name} className="absolute inset-0" />
          <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
            <Chip variant="dark">Destaque</Chip>
            <Chip variant="mid">Uso diário</Chip>
          </div>
          <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:bottom-6 md:max-w-[420px] px-3 py-2 bg-paper-50 backdrop-blur-[20px] rounded-r flex items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {featured.name}
              </div>
              <div className="flex items-baseline gap-2 text-xs whitespace-nowrap">
                <span className="text-ink-50">{brl(featured.price)} un.</span>
                {featured.old_price ? (
                  <span className="text-ink-25 line-through">{brl(featured.old_price)}</span>
                ) : null}
              </div>
            </div>
            <IconChevronRight className="text-ink-50" />
          </div>
        </Link>
      ) : null}

      <div className={featured ? "mt-5 md:mt-8" : ""}>
        <CatalogControls brands={brands} countLabel={`${products.length} modelos`} />
      </div>

      <div className="mt-5 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-8">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} delayStep={i} />
        ))}
      </div>

      {empty ? (
        <div className="py-12 md:py-24 text-center text-sm text-ink-50">Nenhum modelo encontrado.</div>
      ) : (
        <div className="mt-6 md:mt-10 text-xs text-ink-25">Selecionado SOFTY.</div>
      )}
    </div>
  );
}
