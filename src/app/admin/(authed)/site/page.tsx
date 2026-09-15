import { getBanners, getEtiquetas, getSiteSettings } from "@/lib/data";
import { SiteView } from "@/components/admin/SiteView";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const [settings, banners, etiquetas] = await Promise.all([
    getSiteSettings(),
    getBanners(),
    getEtiquetas(),
  ]);

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <SiteView settings={settings} banners={banners} etiquetas={etiquetas} />
    </div>
  );
}
