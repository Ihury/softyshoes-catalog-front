import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/data";
import { ProductDetail } from "@/components/client/ProductDetail";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const supabase = await createClient();
  const { data: relatedRaw } = await supabase
    .from("products")
    .select("*, brand:brands(*)")
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  return <ProductDetail product={product} related={(relatedRaw as Product[]) ?? []} />;
}
