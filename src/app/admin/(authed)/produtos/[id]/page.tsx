import { notFound } from "next/navigation";
import { getBrands, getCatalogSizes, getEtiquetas, getFilters, getProductById } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, etiquetas, filters, catalogSizes] = await Promise.all([
    getProductById(id),
    getBrands(),
    getEtiquetas(),
    getFilters(),
    getCatalogSizes(),
  ]);
  if (!product) notFound();

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8">
      <ProductForm
        product={product}
        brands={brands}
        etiquetas={etiquetas}
        filters={filters}
        catalogSizes={catalogSizes}
      />
    </div>
  );
}
