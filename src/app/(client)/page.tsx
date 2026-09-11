import Link from "next/link";
import { getCatalog, getFeatured, getPublicBrands } from "@/lib/catalog";
import { CatalogControls } from "@/components/client/CatalogControls";
import { CatalogCount, CatalogGrid } from "@/components/client/CatalogGrid";
import { Chip } from "@/components/ui/Chip";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronRight } from "@/components/icons";
import { brl } from "@/lib/format";

// Static, revalidated on a timer and on every admin write. The whole catalog
// ships once and the browser narrows it, so a filter costs no request and this
// page can be served from the CDN.
export const revalidate = 300;

export default async function HomePage() {
  const [brands, featured, products] = await Promise.all([
    getPublicBrands(),
    getFeatured(),
    getCatalog("Todos", null, null),
  ]);

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-6 md:px-12 md:pt-8 pb-6 md:pb-14 flex flex-col">
      {featured ? (
        <Link
          href={`/produto/${featured.id}`}
          prefetch
          className="flex-none block w-full text-left relative h-[223px] md:h-[440px] rounded-ui md:rounded-none overflow-hidden transition-transform duration-200 active:scale-[.985]"
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
        <CatalogControls brands={brands} countLabel={<CatalogCount products={products} />} />
      </div>

      <div className="mt-5 md:mt-8 flex-1 flex flex-col">
        <CatalogGrid products={products} />
      </div>
    </div>
  );
}
