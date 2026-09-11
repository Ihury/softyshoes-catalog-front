import { notFound } from "next/navigation";
import { getCatalog, getPublicProduct, getRelated } from "@/lib/catalog";
import { ProductDetail } from "@/components/client/ProductDetail";

// Rendered once per model and cached at the edge, refreshed on a timer and on
// every admin save. A visitor opening a model that someone already opened gets
// it straight from the CDN.
export const revalidate = 300;

/**
 * Prerenders every model that exists at build time, so a visitor never pays for
 * the first render of a page. A model added afterwards is rendered on its first
 * request and cached from then on (dynamicParams stays on by default).
 */
export async function generateStaticParams() {
  const products = await getCatalog("Todos", null, null);
  return products.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, related] = await Promise.all([getPublicProduct(id), getRelated(id)]);
  if (!product) notFound();

  return <ProductDetail product={product} related={related} />;
}
