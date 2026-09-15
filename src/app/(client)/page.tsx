import {
  getCatalog,
  getFeatured,
  getPublicBanners,
  getPublicBrands,
  getPublicFilters,
  getPublicSiteSettings,
} from "@/lib/catalog";
import { CatalogControls } from "@/components/client/CatalogControls";
import { CatalogCount, CatalogGrid } from "@/components/client/CatalogGrid";
import { HomeHero } from "@/components/client/HomeHero";

// Static, revalidated on a timer and on every admin write. The whole catalog
// ships once and the browser narrows it, so a filter costs no request and this
// page can be served from the CDN.
export const revalidate = 300;

export default async function HomePage() {
  const [brands, filters, featured, products, banners, site] = await Promise.all([
    getPublicBrands(),
    getPublicFilters(),
    getFeatured(),
    getCatalog(),
    getPublicBanners(),
    getPublicSiteSettings(),
  ]);

  const hasHero = banners.length > 0 || !!featured;

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,4vw,48px)] md:pt-8 pb-6 md:pb-14 flex flex-col">
      <HomeHero banners={banners} featured={featured} heroMode={site.hero_mode} />

      <div className={hasHero ? "mt-5 md:mt-8" : ""}>
        <CatalogControls
          brands={brands}
          filters={filters}
          countLabel={<CatalogCount products={products} />}
        />
      </div>

      <div className="mt-5 md:mt-8 flex-1 flex flex-col">
        <CatalogGrid products={products} />
      </div>
    </div>
  );
}
