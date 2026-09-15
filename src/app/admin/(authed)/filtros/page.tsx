import { getFilters, getRuleUsage } from "@/lib/data";
import { FiltersView } from "@/components/admin/FiltersView";

export const dynamic = "force-dynamic";

export default async function FiltersPage() {
  const [filters, usage] = await Promise.all([getFilters(), getRuleUsage()]);

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <FiltersView rows={filters} usage={usage} />
    </div>
  );
}
