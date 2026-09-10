import { getSellerSettings } from "@/lib/data";
import { CartView } from "@/components/client/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const seller = await getSellerSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return <CartView seller={seller} siteUrl={siteUrl} />;
}
