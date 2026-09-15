import { getSellerSettings } from "@/lib/data";
import { SellerView } from "@/components/admin/SellerView";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const seller = await getSellerSettings();
  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[520px] md:max-w-none">
      <SellerView seller={seller} />
    </div>
  );
}
