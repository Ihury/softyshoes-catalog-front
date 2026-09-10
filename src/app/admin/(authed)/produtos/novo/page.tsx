import { getBrands } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const brands = await getBrands();
  return (
    <div className="px-6 md:px-10 pt-6 md:pt-8">
      <ProductForm product={null} brands={brands} />
    </div>
  );
}
