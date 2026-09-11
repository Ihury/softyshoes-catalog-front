import { getPublicSeller } from "@/lib/catalog";
import { CartView } from "@/components/client/CartView";

export default async function CartPage() {
  const seller = await getPublicSeller();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return <CartView seller={seller} siteUrl={siteUrl} />;
}
