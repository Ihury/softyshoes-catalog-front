import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { BRANDS_TAG, CATALOG_TAG, SELLER_TAG } from "@/lib/cache-tags";
import { asList } from "@/lib/types";
import type { Brand, CatalogItem, Order, Product, SellerSettings, Tab } from "@/lib/types";

/**
 * Read-only Supabase client for the public storefront.
 *
 * The cookie-bound client in `lib/supabase/server` cannot be used inside
 * `unstable_cache` (a cached scope may not read cookies), and the storefront
 * has nothing user-specific to read anyway — every row it touches is world
 * readable under RLS. A plain anon client keeps these queries cacheable and
 * shared across all visitors.
 */
const anon = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Columns a catalog card needs. Skips description/spec, which are long and
 *  only ever read on the detail screen. */
const CARD_COLUMNS =
  "id,name,price,old_price,photos,promotion,available,ordered,featured,brand:brands(id,name)";

/** Cached reads share one lifetime: five minutes of staleness at most, and any
 *  admin write clears them immediately via the tags above. */
const CACHE = { tags: [CATALOG_TAG], revalidate: 300 };

/**
 * Turns a failed request into a thrown error instead of an empty result.
 *
 * These readers are cached, so returning null on a transport failure would
 * freeze that failure for the whole revalidate window — a blip while reading a
 * product would serve a 404 for five minutes. A throw is never cached, so the
 * next request simply tries again.
 */
function orThrow<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data;
}

/** Guarantees `photos` and `sizes` are arrays before anything renders them. */
function normalizeCard<T extends { photos?: unknown }>(row: T): T {
  return { ...row, photos: asList<string>(row.photos) };
}

async function queryCatalog(tab: Tab, brandId: string | null, q: string | null) {
  let query = anon.from("products").select(CARD_COLUMNS).order("created_at", { ascending: false });

  if (tab === "Promoção") query = query.eq("promotion", true);
  if (tab === "Disponíveis") query = query.eq("available", true);
  if (tab === "Pedidos") query = query.eq("ordered", true);
  // Filtering in Postgres rather than in JS keeps both the work and the
  // payload proportional to what actually gets shown.
  if (brandId) query = query.eq("brand_id", brandId);
  if (q) query = query.ilike("name", `%${q}%`);

  const data = orThrow(await query);
  return ((data as CatalogItem[] | null) ?? []).map(normalizeCard);
}

/**
 * Catalog listing for the storefront. `unstable_cache` folds the arguments
 * into the cache key, so each tab/brand/search combination is fetched from
 * Postgres once and then served from cache — re-picking a filter or repeating
 * a search costs nothing. Any admin save drops every variant at once through
 * the shared tag.
 */
export const getCatalog = unstable_cache(
  (tab: Tab, brandId: string | null, q: string | null): Promise<CatalogItem[]> =>
    queryCatalog(tab, brandId, q),
  ["catalog"],
  CACHE
);

export const getPublicBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    return orThrow(await anon.from("brands").select("id,name,created_at").order("name")) ?? [];
  },
  ["brands"],
  { tags: [BRANDS_TAG], revalidate: 300 }
);

export const getFeatured = unstable_cache(
  async (): Promise<CatalogItem | null> => {
    const data = orThrow(
      await anon.from("products").select(CARD_COLUMNS).eq("featured", true).limit(1).maybeSingle()
    );
    return data ? normalizeCard(data as unknown as CatalogItem) : null;
  },
  ["featured"],
  CACHE
);

export const getPublicProduct = unstable_cache(
  async (id: string): Promise<Product | null> => {
    const data = orThrow(
      await anon.from("products").select("*, brand:brands(id,name)").eq("id", id).maybeSingle()
    );
    if (!data) return null;
    const row = data as Product;
    return { ...row, photos: asList<string>(row.photos), sizes: asList<number>(row.sizes) };
  },
  ["product"],
  CACHE
);

export const getRelated = unstable_cache(
  async (id: string): Promise<CatalogItem[]> => {
    const data = orThrow(
      await anon
        .from("products")
        .select(CARD_COLUMNS)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(8)
    );
    return ((data as CatalogItem[] | null) ?? []).map(normalizeCard);
  },
  ["related"],
  CACHE
);

export const getPublicSeller = unstable_cache(
  async (): Promise<SellerSettings> => {
    const data = orThrow(await anon.from("seller_settings").select("*").eq("id", 1).maybeSingle());
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
  },
  ["seller"],
  { tags: [SELLER_TAG], revalidate: 300 }
);

/** Orders never change after they are written, so the shared link can be
 *  served from cache for a long while. */
export const getPublicOrder = unstable_cache(
  async (id: string): Promise<Order | null> => {
    const data = orThrow(await anon.from("orders").select("*").eq("id", id).maybeSingle());
    if (!data) return null;
    const row = data as Order;
    return { ...row, items: asList<Order["items"][number]>(row.items) };
  },
  ["order"],
  { revalidate: 3600 }
);
