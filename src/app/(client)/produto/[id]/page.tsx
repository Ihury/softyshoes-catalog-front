import { notFound } from "next/navigation";
import { getPublicProduct, getRelated } from "@/lib/catalog";
import { ProductDetail } from "@/components/client/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, related] = await Promise.all([getPublicProduct(id), getRelated(id)]);
  if (!product) notFound();

  return <ProductDetail product={product} related={related} />;
}
