import { notFound, permanentRedirect } from "next/navigation";
import { getCatalog, getPublicProduct, getPublicSizes, getRelated } from "@/lib/catalog";
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
  const products = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, related, catalogSizes] = await Promise.all([
    getPublicProduct(slug),
    getRelated(slug),
    getPublicSizes(),
  ]);
  if (!product) notFound();

  // Links shared before slugs existed carry the uuid. They still resolve, and
  // are sent on to the readable address rather than left on the old one.
  if (product.slug !== slug) permanentRedirect(`/produto/${product.slug}`);

  return <ProductDetail product={product} related={related} catalogSizes={catalogSizes} />;
}
