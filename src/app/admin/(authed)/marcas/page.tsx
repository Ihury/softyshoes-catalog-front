import { createClient } from "@/lib/supabase/server";
import { getBrands } from "@/lib/data";
import { BrandsView } from "@/components/admin/BrandsView";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const supabase = await createClient();
  const [brands, { data: productsRaw }] = await Promise.all([
    getBrands(),
    supabase.from("products").select("id, brand_id, available"),
  ]);
  const products = (productsRaw as Pick<Product, "id" | "brand_id" | "available">[]) ?? [];

  const rows = brands.map((b) => {
    const items = products.filter((p) => p.brand_id === b.id);
    return {
      id: b.id,
      name: b.name,
      position: b.position ?? 0,
      total: items.length,
      published: items.filter((p) => p.available).length,
    };
  });

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <BrandsView rows={rows} />
    </div>
  );
}
