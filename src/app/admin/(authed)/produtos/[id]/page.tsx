import { notFound } from "next/navigation";
import { getBrands, getProductById, getTags } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, tags] = await Promise.all([getProductById(id), getBrands(), getTags()]);
  if (!product) notFound();

  return (
    <div className="px-6 md:px-10 md:pt-8">
      <ProductForm product={product} brands={brands} tags={tags} />
    </div>
  );
}
