import Link from "next/link";
import { getCatalog, getFeatured, getPublicBrands } from "@/lib/catalog";
import { CatalogControls } from "@/components/client/CatalogControls";
import { FilterResults } from "@/components/client/FilterNavigation";
import { ProductCard } from "@/components/client/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronRight } from "@/components/icons";
import { brl } from "@/lib/format";
import { TABS, type Tab } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; brand?: string; q?: string }>;
}) {
  const { tab, brand, q } = await searchParams;
  const activeTab = TABS.includes(tab as Tab) ? (tab as Tab) : "Todos";
  const search = q && q.trim().length >= 2 ? q.trim() : null;

  // Brands and the featured model are shared across every filter combination,
  // so they resolve from cache while the listing runs.
  const [brands, featured] = await Promise.all([getPublicBrands(), getFeatured()]);
  const brandId = brand ? (brands.find((b) => b.name === brand)?.id ?? null) : null;
  // A ?brand= that matches no registered brand filters everything out rather
  // than silently falling back to the unfiltered catalog.
  const products = brand && !brandId ? [] : await getCatalog(activeTab, brandId, search);

  const empty = products.length === 0;

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 md:pt-8 pb-6 md:pb-14">
      {featured ? (
        <Link
          href={`/produto/${featured.id}`}
          prefetch
          className="block w-full text-left relative h-[223px] md:h-[440px] rounded-ui md:rounded-none overflow-hidden transition-transform duration-200 active:scale-[.985]"
          style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both" }}
        >
          <ProductImage
            src={featured.photos?.[0]}
            alt={featured.name}
            className="absolute inset-0"
            sizes="(min-width: 1280px) 1184px, 100vw"
            priority
          />
          <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
            {/* Mobile mirrors the model's own chip; desktop labels the slot. */}
            <Chip variant="dark">
              <span className="md:hidden">{featured.promotion ? "Promoção" : "Disponível"}</span>
              <span className="hidden md:inline">Destaque</span>
            </Chip>
            <Chip variant="mid">Uso diário</Chip>
          </div>
          <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:bottom-6 md:max-w-[420px] px-3 py-2 bg-paper-50 backdrop-blur-[20px] rounded-ui flex items-center gap-3 md:gap-4">
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

      <div className="mt-5 md:mt-8">
        <FilterResults>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-8">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delayStep={i} />
            ))}
          </div>

          {empty ? (
            <div className="py-12 md:py-24 text-center text-sm text-ink-50">Nenhum modelo encontrado.</div>
          ) : (
            <div className="mt-6 md:mt-10 text-xs text-ink-25">Selecionado SOFTY.</div>
          )}
        </FilterResults>
      </div>
    </div>
  );
}
