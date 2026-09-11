// Cookie-bound reads for the admin panel. The public storefront reads through
// `lib/catalog` instead, which is cached and shared across visitors.
import { createClient } from "@/lib/supabase/server";
import type { Brand, Product, SellerSettings } from "@/lib/types";

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, brand:brands(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Product | null) ?? null;
}

export async function getSellerSettings(): Promise<SellerSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("seller_settings").select("*").eq("id", 1).single();
  return (
    (data as SellerSettings) ?? {
      id: 1,
      name: "",
      phone: "",
      message: "",
      send_photos: true,
      send_sizes: true,
      updated_at: new Date().toISOString(),
    }
  );
}
