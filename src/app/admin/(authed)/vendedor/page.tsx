import { getSellerSettings } from "@/lib/data";
import { SellerView } from "@/components/admin/SellerView";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const seller = await getSellerSettings();
  return (
    <div className="px-6 md:px-10 pt-6 md:pt-8 pb-24 md:pb-14 max-w-[520px]">
      <SellerView seller={seller} />
    </div>
  );
}
