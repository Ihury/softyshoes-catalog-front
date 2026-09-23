import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import {
  BRANDS_TAG,
  CATALOG_TAG,
  FILTERS_TAG,
  SELLER_TAG,
  SITE_TAG,
  SIZES_TAG,
} from "@/lib/cache-tags";
import { asList, normalizeEtiquetas, normalizeProductRow } from "@/lib/types";
import type {
  Banner,
  Brand,
  CatalogItem,
  Filter,
  Order,
  Product,
  SellerSettings,
  SiteSettings,
} from "@/lib/types";

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

/**
 * Columns a catalog card needs. Skips description/spec, which are long and only
 * ever read on the detail screen.
 *
 * Embeds are one FK hop each on purpose. PostgREST can also resolve `tags(...)`
 * straight through the junction table, but that relies on it picking the right
 * relationship; `product_tags -> tags` follows a single declared foreign key
 * and cannot be ambiguous.
 */
const CARD_COLUMNS =
  "id,slug,name,price,old_price,photos,promotion,available,ordered,featured," +
  "brand:brands(id,name),product_tags(position,tag:tags(id,name,style))";

/** Cached reads share one lifetime: five minutes of staleness at most, and any
 *  admin write clears them immediately via the tags above.
 *
 *  The key parts carry a version suffix because Vercel's Data Cache survives a
 *  deployment: bumping them makes entries written by the previous shape
 *  unreachable instead of half-readable. */
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

/**
 * Guarantees `photos` is an array and flattens the etiqueta join into an
 * ordered list, so nothing downstream has to know the shape PostgREST returns.
 */
function normalizeCard(row: unknown): CatalogItem {
  const r = row as CatalogItem & { product_tags?: unknown };
  const { product_tags, ...card } = r;
  return {
    ...card,
    photos: asList<string>(r.photos),
    etiquetas: normalizeEtiquetas(product_tags),
  };
}

/**
 * The whole catalog, in the seller's manual order.
 *
 * Filtering moved into the browser when the tabs became client-side, so this
 * reader takes no arguments: one query serves every tab, brand and search, and
 * the result is cached once for everyone.
 */
export const getCatalog = unstable_cache(
  async (): Promise<CatalogItem[]> => {
    const data = orThrow(
      await anon
        .from("products")
        .select(CARD_COLUMNS)
        .order("position")
        .order("created_at", { ascending: false })
    );
    return asList<unknown>(data).map(normalizeCard);
  },
  ["catalog", "v2"],
  CACHE
);

export const getPublicBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    const rows =
      orThrow(
        await anon.from("brands").select("id,name,position,created_at").order("position").order("name")
      ) ?? [];
    // The seller's choice on the Marcas screen, applied here so every menu that
    // draws this list agrees. Saving it busts BRANDS_TAG, which is what makes
    // the switch show up on the storefront rather than only in the admin.
    const { brand_order } = await getPublicSiteSettings();
    return brand_order === "az"
      ? rows.slice().sort((a, b) => a.name.localeCompare(b.name, "pt"))
      : rows;
  },
  ["brands", "v2"],
  { tags: [BRANDS_TAG, SITE_TAG], revalidate: 300 }
);

export const getFeatured = unstable_cache(
  async (): Promise<CatalogItem | null> => {
    const data = orThrow(
      await anon.from("products").select(CARD_COLUMNS).eq("featured", true).limit(1).maybeSingle()
    );
    return data ? normalizeCard(data) : null;
  },
  ["featured", "v2"],
  CACHE
);

/** Links minted before slugs existed still carry a bare uuid. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getPublicProduct = unstable_cache(
  async (slugOrId: string): Promise<Product | null> => {
    const query = anon
      .from("products")
      .select("*, brand:brands(id,name), product_tags(position,tag:tags(id,name,style))");
    const data = orThrow(
      await (UUID.test(slugOrId)
        ? query.eq("id", slugOrId)
        : query.eq("slug", slugOrId)
      ).maybeSingle()
    );
    if (!data) return null;
    return normalizeProductRow(data);
  },
  ["product", "v2"],
  CACHE
);

/** The seller's tabs, in the order the storefront shows them. */
export const getPublicFilters = unstable_cache(
  async (): Promise<Filter[]> => {
    const data = orThrow(
      await anon.from("filters").select("id,name,rule,position").order("position").order("name")
    );
    return asList<Filter>(data);
  },
  ["filters"],
  { tags: [FILTERS_TAG], revalidate: 300 }
);

/** The seller's global numbering list. */
export const getPublicSizes = unstable_cache(
  async (): Promise<number[]> => {
    const data = orThrow(await anon.from("catalog_sizes").select("value").order("value"));
    return asList<{ value: number }>(data).map((r) => r.value);
  },
  ["sizes"],
  { tags: [SIZES_TAG], revalidate: 300 }
);

export const getPublicSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const data = orThrow(await anon.from("site_settings").select("*").eq("id", 1).maybeSingle());
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
  },
  ["site"],
  { tags: [SITE_TAG], revalidate: 300 }
);

/** Only the visible banners, in the seller's order — the hidden ones never
 *  reach the browser. */
export const getPublicBanners = unstable_cache(
  async (): Promise<Banner[]> => {
    const data = orThrow(
      await anon
        .from("banners")
        .select("id,title,subtitle,tag_id,image_url,visible,position,tag:tags(id,name,style)")
        .eq("visible", true)
        .order("position")
    );
    return asList<Banner>(data);
  },
  ["banners"],
  { tags: [SITE_TAG], revalidate: 300 }
);

export const getRelated = unstable_cache(
  async (slug: string): Promise<CatalogItem[]> => {
    const data = orThrow(
      await anon
        .from("products")
        .select(CARD_COLUMNS)
        .neq("slug", slug)
        .order("position")
        .limit(8)
    );
    return asList<unknown>(data).map(normalizeCard);
  },
  ["related", "v2"],
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

/**
 * Checks one discount code.
 *
 * `coupons` is deliberately unreadable to anon under RLS, so a visitor cannot
 * list every code; this goes through a SECURITY DEFINER function that answers a
 * single question. Never cached — a code the seller just switched off has to
 * stop working immediately.
 */
export async function checkCoupon(
  code: string
): Promise<{ code: string; percent: number } | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const { data, error } = await anon.rpc("validate_coupon", { p_code: trimmed });
  if (error) return null;
  const hit = asList<{ code: string; percent: number }>(data)[0];
  return hit ?? null;
}

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
