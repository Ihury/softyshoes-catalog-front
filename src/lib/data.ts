// Cookie-bound reads for the admin panel. The public storefront reads through
// `lib/catalog` instead, which is cached and shared across visitors.
import { createClient } from "@/lib/supabase/server";
import { asList, normalizeProductRow } from "@/lib/types";
import type {
  Banner,
  Brand,
  Coupon,
  Etiqueta,
  Filter,
  FilterRule,
  Product,
  SellerSettings,
  SiteSettings,
} from "@/lib/types";

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}

/** Guarantees the list columns are arrays before any component maps over them. */
export function normalizeProduct(row: Product): Product {
  return normalizeProductRow(row);
}

export async function getFilters(): Promise<Filter[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filters")
    .select("id,name,rule,position")
    .order("position")
    .order("name");
  return asList<Filter>(data);
}

/**
 * The etiqueta registry.
 *
 * `style is not null` is what separates a real etiqueta from the filter rows
 * that still share this table during the migration window. Harmless once those
 * are gone, and it keeps the screen honest until then.
 */
export async function getEtiquetas(): Promise<Etiqueta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id,name,style,position")
    .not("style", "is", null)
    .order("position")
    .order("name");
  return asList<Etiqueta>(data);
}

/** Etiqueta id -> how many models carry it, for the counts on the registry. */
export async function getEtiquetaUsage(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_tags").select("tag_id");
  const usage: Record<string, number> = {};
  for (const row of asList<{ tag_id: string }>(data)) {
    usage[row.tag_id] = (usage[row.tag_id] ?? 0) + 1;
  }
  return usage;
}

/** How many models each rule would show, for the counts on the filters screen. */
export async function getRuleUsage(): Promise<Record<FilterRule, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("promotion,available,ordered");
  const rows = asList<{ promotion: boolean; available: boolean; ordered: boolean }>(data);
  return {
    todos: rows.length,
    promo: rows.filter((r) => r.promotion).length,
    disp: rows.filter((r) => r.available).length,
    ped: rows.filter((r) => r.ordered).length,
  };
}

export async function getCatalogSizes(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("catalog_sizes").select("value").order("value");
  return asList<{ value: number }>(data).map((r) => r.value);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, brand:brands(*), product_tags(position,tag:tags(id,name,style))")
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

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (
    (data as SiteSettings) ?? {
      id: 1,
      favicon_url: "",
      hero_mode: "replace",
      brand_order: "az",
      hero_card_style: "claro",
      updated_at: new Date().toISOString(),
    }
  );
}

/** Every banner, hidden ones included — the admin screen edits them all. */
export async function getBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("id,title,subtitle,tag_id,image_url,visible,position,tag:tags(id,name,style)")
    .order("position");
  return asList<Banner>(data);
}

export async function getCoupons(): Promise<Coupon[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("id,code,percent,active")
    .order("code");
  return asList<Coupon>(data);
}
