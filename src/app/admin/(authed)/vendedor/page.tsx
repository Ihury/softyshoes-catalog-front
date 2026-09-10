import { getSellerSettings } from "@/lib/data";
import { SellerView } from "@/components/admin/SellerView";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const seller = await getSellerSettings();
  return (
    <div className="px-6 md:px-10 md:pt-8 pb-[82px] md:pb-14 max-w-[520px] md:max-w-none">
      <SellerView seller={seller} />
    </div>
  );
}
