import { createClient } from "@/lib/supabase/server";
import { getCatalogSizes } from "@/lib/data";
import { SizesView } from "@/components/admin/SizesView";
import { asList } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SizesPage() {
  const supabase = await createClient();
  const [sizes, { data }] = await Promise.all([
    getCatalogSizes(),
    supabase.from("products").select("sizes"),
  ]);

  // How many models carry each number, so removing one from the list can say
  // what it leaves behind.
  const usage: Record<number, number> = {};
  for (const row of asList<{ sizes: unknown }>(data)) {
    for (const n of asList<number>(row.sizes)) usage[n] = (usage[n] ?? 0) + 1;
  }

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <SizesView sizes={sizes} usage={usage} />
    </div>
  );
}
