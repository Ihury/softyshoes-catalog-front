import { getBrands, getTags } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [brands, tags] = await Promise.all([getBrands(), getTags()]);
  return (
    <div className="px-6 md:px-10 md:pt-8">
      <ProductForm product={null} brands={brands} tags={tags} />
    </div>
  );
}
