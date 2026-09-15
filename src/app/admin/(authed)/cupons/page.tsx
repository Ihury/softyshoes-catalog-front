import { getCoupons } from "@/lib/data";
import { CouponsView } from "@/components/admin/CouponsView";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <CouponsView rows={coupons} />
    </div>
  );
}
