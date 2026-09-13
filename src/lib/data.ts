// Cookie-bound reads for the admin panel. The public storefront reads through
// `lib/catalog` instead, which is cached and shared across visitors.
import { createClient } from "@/lib/supabase/server";
import { asList, normalizeProductRow } from "@/lib/types";
import type { Brand, Product, SellerSettings, Tag } from "@/lib/types";

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}

/** Guarantees the list columns are arrays before any component maps over them. */
export function normalizeProduct(row: Product): Product {
  return normalizeProductRow(row);
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id,name,position")
    .order("position")
    .order("name");
  return asList<Tag>(data);
}

/** Tag id -> how many models carry it, for the counts on the tags screen. */
export async function getTagUsage(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_tags").select("tag_id");
  const usage: Record<string, number> = {};
  for (const row of asList<{ tag_id: string }>(data)) {
    usage[row.tag_id] = (usage[row.tag_id] ?? 0) + 1;
  }
  return usage;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, brand:brands(*), product_tags(tag_id)")
    .eq("id", id)
    .maybeSingle();
  return data ? normalizeProduct(data as Product) : null;
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
