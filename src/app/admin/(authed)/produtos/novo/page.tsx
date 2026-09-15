import { getBrands, getCatalogSizes, getEtiquetas, getFilters } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [brands, etiquetas, filters, catalogSizes] = await Promise.all([
    getBrands(),
    getEtiquetas(),
    getFilters(),
    getCatalogSizes(),
  ]);
  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8">
      <ProductForm
        product={null}
        brands={brands}
        etiquetas={etiquetas}
        filters={filters}
        catalogSizes={catalogSizes}
      />
    </div>
  );
}
