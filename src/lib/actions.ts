"use server";

import { revalidatePath, revalidateTag } from "next/cache";

// Admin writes are rare and whoever saved expects to see the change on the
// storefront right away, so tags expire immediately (`expire: 0`) instead of
// serving stale content for one more request.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseMoney } from "@/lib/format";
import {
  BRANDS_TAG,
  CATALOG_TAG,
  FILTERS_TAG,
  SELLER_TAG,
  SITE_TAG,
  SIZES_TAG,
} from "@/lib/cache-tags";
import { asList, FILTER_RULES, ETIQUETA_STYLES } from "@/lib/types";
import { checkCoupon } from "@/lib/catalog";
import type { BrandOrder, EtiquetaStyle, FilterRule, HeroMode, OrderItem } from "@/lib/types";

// ---------- Auth ----------

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Where the proxy bounced this person from. Only same-site admin paths are
  // honoured, so a crafted ?next= cannot turn the login into an open redirect.
  const requested = String(formData.get("next") ?? "");
  const next = /^\/admin(\/|$)/.test(requested) ? requested : "/admin";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (next !== "/admin") params.set("next", next);
    redirect(`/admin/login?${params.toString()}`);
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Refreshes the prerendered storefront after a catalog write.
 *
 * Clearing the data-cache tag is not enough on its own any more: `/` and
 * `/produto/[slug]` are prerendered, so without this an admin save would keep
 * serving the old HTML until the revalidate window expired — the seller would
 * edit a model and not see it on the site for five minutes. `layout` covers
 * every page under the storefront tree, the product pages included.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

/**
 * Moves a row one place within an ordered list, then renumbers the whole
 * sequence.
 *
 * Positions can be duplicated or all zero in rows written before they mattered,
 * so trading two values would leave the order unchanged. Rewriting the run from
 * the reordered list always lands somewhere consistent.
 */
async function moveWithin(
  supabase: SupabaseClient,
  table: string,
  id: string,
  direction: "up" | "down",
  order: string
): Promise<string | null> {
  const rows = await orderedIds(supabase, table, order);
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return null;
  return renumber(supabase, table, rows, i, j);
}

/**
 * Moves a row to where `neighbourId` sits, rather than one step.
 *
 * This is what lets the arrows work while a filter is on. The listing only
 * shows some of the catalog, so "up" means "above the row above me *on screen*"
 * — which can be several places away in the stored order. The client sends the
 * neighbour it drew; the server resolves both to indexes and moves one to the
 * other, leaving everything in between in the order it was.
 */
async function placeNextTo(
  supabase: SupabaseClient,
  table: string,
  id: string,
  neighbourId: string,
  order: string
): Promise<string | null> {
  const rows = await orderedIds(supabase, table, order);
  const from = rows.findIndex((r) => r.id === id);
  const to = rows.findIndex((r) => r.id === neighbourId);
  if (from < 0 || to < 0 || from === to) return null;
  return renumber(supabase, table, rows, from, to);
}

async function orderedIds(supabase: SupabaseClient, table: string, order: string) {
  const { data } = await supabase.from(table).select("id,position").order("position").order(order);
  return asList<{ id: string; position: number }>(data);
}

/**
 * Lifts the row at `from` out and drops it back in at `to`, then writes the
 * positions that actually changed.
 *
 * Removing before inserting is what makes one index work for both directions:
 * moving down, the target shifts left by one as the row leaves, and inserting
 * at `to` lands just after it; moving up, nothing before it shifts, and `to` is
 * the spot in front of it.
 *
 * Only the rows whose number moved are written. The old code renumbered the
 * whole list — 59 sequential round trips for one click on this catalog, which
 * is most of why the arrows felt like they had stopped responding. A run with
 * duplicated or all-zero positions still heals, because the target numbering is
 * computed for the entire list either way.
 */
async function renumber(
  supabase: SupabaseClient,
  table: string,
  rows: { id: string; position: number }[],
  from: number,
  to: number
): Promise<string | null> {
  const reordered = rows.slice();
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);

  const writes = reordered
    .map((row, k) => ({ id: row.id, position: k + 1, was: row.position }))
    .filter((row) => row.position !== row.was);

  const results = await Promise.all(
    writes.map((row) => supabase.from(table).update({ position: row.position }).eq("id", row.id))
  );
  const failed = results.find((r) => r.error);
  return failed?.error?.message ?? null;
}

/** Where a new row lands: at the end, never jumping to the front. Taken in JS
 *  rather than with order+limit — these lists hold a handful of rows, and this
 *  cannot be thrown off by how ties are ordered. */
async function nextPosition(supabase: SupabaseClient, table: string): Promise<number> {
  const { data } = await supabase.from(table).select("position");
  return asList<{ position: number }>(data).reduce((max, r) => Math.max(max, r.position ?? 0), 0) + 1;
}

// ---------- Brands ----------

function afterBrandWrite() {
  revalidateTag(BRANDS_TAG, { expire: 0 });
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/marcas");
  revalidatePath("/admin");
}

export async function createBrand(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome da marca." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) return { error: "Marca já cadastrada." };
  const position = await nextPosition(supabase, "brands");
  const { error } = await supabase.from("brands").insert({ name: trimmed, position });
  if (error) return { error: error.message };
  afterBrandWrite();
  return { error: null };
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { error: error.message };
  afterBrandWrite();
  return { error: null };
}

export async function moveBrand(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const error = await moveWithin(supabase, "brands", id, direction, "name");
  if (error) return { error };
  afterBrandWrite();
  return { error: null };
}

// ---------- Filters (the catalog tab bar) ----------

function afterFilterWrite() {
  revalidateTag(FILTERS_TAG, { expire: 0 });
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/filtros");
  revalidatePath("/admin");
}

/**
 * Seller-defined tabs. The name is free text because the behaviour comes from
 * the rule, not the label — renaming "Promoção" to "Ofertas da semana" changes
 * nothing about what the tab shows.
 */
export async function createFilter(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome do filtro." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("filters")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) return { error: "Filtro já cadastrado." };

  const position = await nextPosition(supabase, "filters");
  const { error } = await supabase
    .from("filters")
    .insert({ name: trimmed, rule: "todos", position });
  if (error) return { error: error.message };
  afterFilterWrite();
  return { error: null };
}

export async function renameFilter(id: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome do filtro." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("filters")
    .select("id")
    .ilike("name", trimmed)
    .neq("id", id)
    .maybeSingle();
  if (existing) return { error: "Já existe um filtro com esse nome." };
  const { error } = await supabase.from("filters").update({ name: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  afterFilterWrite();
  return { error: null };
}

export async function setFilterRule(id: string, rule: FilterRule) {
  if (!FILTER_RULES.includes(rule)) return { error: "Regra inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("filters").update({ rule }).eq("id", id);
  if (error) return { error: error.message };
  afterFilterWrite();
  return { error: null };
}

export async function moveFilter(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const error = await moveWithin(supabase, "filters", id, direction, "name");
  if (error) return { error };
  afterFilterWrite();
  return { error: null };
}

export async function deleteFilter(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("filters").delete().eq("id", id);
  if (error) return { error: error.message };
  afterFilterWrite();
  return { error: null };
}

// ---------- Etiquetas (the label over a photo) ----------

function afterEtiquetaWrite() {
  // No cache tag of its own: the storefront never reads the registry on its
  // own — the names and finishes ride inside each card — so a rename or a
  // restyle is a catalog change.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/etiquetas");
  revalidatePath("/admin");
}

export async function createEtiqueta(name: string, style: EtiquetaStyle = "escuro") {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome da etiqueta." };
  if (!ETIQUETA_STYLES.includes(style)) return { error: "Acabamento inválido." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) return { error: "Etiqueta já cadastrada." };

  const position = await nextPosition(supabase, "tags");
  const { error } = await supabase.from("tags").insert({ name: trimmed, style, position });
  if (error) return { error: error.message };
  afterEtiquetaWrite();
  return { error: null };
}

export async function renameEtiqueta(id: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome da etiqueta." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", trimmed)
    .neq("id", id)
    .maybeSingle();
  if (existing) return { error: "Já existe uma etiqueta com esse nome." };
  const { error } = await supabase.from("tags").update({ name: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  afterEtiquetaWrite();
  return { error: null };
}

export async function setEtiquetaStyle(id: string, style: EtiquetaStyle) {
  if (!ETIQUETA_STYLES.includes(style)) return { error: "Acabamento inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("tags").update({ style }).eq("id", id);
  if (error) return { error: error.message };
  afterEtiquetaWrite();
  return { error: null };
}

/** Removing an etiqueta unlinks it from every model — `product_tags` cascades —
 *  but never touches the models themselves. */
export async function deleteEtiqueta(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };
  afterEtiquetaWrite();
  return { error: null };
}

// ---------- Catalog sizes ----------

function afterSizeWrite() {
  revalidateTag(SIZES_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/numeracoes");
  revalidatePath("/admin");
}

export async function addCatalogSize(value: number) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 10 || n > 99) return { error: "Informe uma numeração." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("catalog_sizes")
    .select("value")
    .eq("value", n)
    .maybeSingle();
  if (existing) return { error: "Numeração já cadastrada." };
  const { error } = await supabase.from("catalog_sizes").insert({ value: n });
  if (error) return { error: error.message };
  afterSizeWrite();
  return { error: null };
}

/** Only the seller's list shrinks. A model that already carries the number keeps
 *  it, and its own grid still shows it. */
export async function removeCatalogSize(value: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("catalog_sizes").delete().eq("value", value);
  if (error) return { error: error.message };
  afterSizeWrite();
  return { error: null };
}

// ---------- Products ----------

export type ProductFormState = { error: string | null };

export async function saveProduct(productId: string | null, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const oldPriceRaw = String(formData.get("old_price") ?? "");
  const brandId = String(formData.get("brand_id") ?? "") || null;
  const description = String(formData.get("description") ?? "");
  const sizes = formData
    .getAll("sizes")
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const photos = formData
    .getAll("photos")
    .map((p) => String(p))
    .filter(Boolean);

  if (!name) return { error: "Informe o nome do modelo." };
  const price = parseMoney(priceRaw);
  if (price == null || price <= 0) return { error: "Informe um preço válido." };
  const oldPrice = oldPriceRaw ? parseMoney(oldPriceRaw) : null;

  const record = {
    name,
    brand_id: brandId,
    price,
    old_price: oldPrice,
    description,
    spec: String(formData.get("spec") ?? ""),
    sizes,
    photos,
    promotion: formData.get("promotion") === "on",
    available: formData.get("available") === "on",
    featured: formData.get("featured") === "on",
    ordered: formData.get("ordered") === "on",
    updated_at: new Date().toISOString(),
  };

  if (record.featured) {
    await supabase.from("products").update({ featured: false }).eq("featured", true);
  }

  let savedId = productId;
  if (productId) {
    const { error } = await supabase.from("products").update(record).eq("id", productId);
    if (error) return { error: error.message };
  } else {
    // A new model goes to the end of the manual order rather than the top, so
    // saving one does not rearrange the storefront under the seller.
    const position = await nextPosition(supabase, "products");
    // The id comes back from the insert because the etiqueta links below are
    // separate rows that have to point at it.
    const { data, error } = await supabase
      .from("products")
      .insert({ ...record, position })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Não foi possível salvar o modelo." };
    savedId = data.id as string;
  }

  const linked = await replaceEtiquetas(
    supabase,
    savedId!,
    formData.getAll("etiquetas").map(String).filter(Boolean)
  );
  if (linked) return { error: linked };

  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * Rewrites a model's etiqueta links from scratch.
 *
 * The form always submits the complete set, so replacing is both simpler and
 * more predictable than diffing. The order matters now — the first one is the
 * chip the card shows — and `getAll` preserves the order the hidden inputs were
 * rendered in, so the seller's "Tornar principal" reaches the database for free.
 *
 * Takes the caller's client rather than opening its own: a save already costs
 * several sequential round trips, and building a second cookie-bound client
 * added one more for nothing.
 */
async function replaceEtiquetas(
  supabase: SupabaseClient,
  productId: string,
  ids: string[]
): Promise<string | null> {
  const { error: cleared } = await supabase
    .from("product_tags")
    .delete()
    .eq("product_id", productId);
  if (cleared) return cleared.message;
  if (ids.length === 0) return null;
  const { error } = await supabase
    .from("product_tags")
    .insert(ids.map((tag_id, i) => ({ product_id: productId, tag_id, position: i })));
  return error ? error.message : null;
}

/**
 * Moves a model to where `neighbourId` sits in the order the storefront shows.
 *
 * The neighbour comes from the listing, so it is the row the seller can see
 * above or below this one — the same thing as one step when nothing is
 * filtered, and the only sensible reading of "up" when something is.
 */
export async function moveProduct(id: string, neighbourId: string) {
  const supabase = await createClient();
  const error = await placeNextTo(supabase, "products", id, neighbourId, "created_at");
  if (error) return { error };
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin");
  return { error: null };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin");
  redirect("/admin");
}

// ---------- Site settings and banners ----------

function afterSiteWrite() {
  revalidateTag(SITE_TAG, { expire: 0 });
  // The brand list is cached separately but reads `brand_order` out of these
  // settings, so it has to go stale with them or the storefront menu keeps the
  // order the seller just changed.
  revalidateTag(BRANDS_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/site");
  revalidatePath("/admin/marcas");
  return { error: null };
}

/** The order the brand menu is drawn in, on the storefront as well as here. */
export async function saveBrandOrder(order: BrandOrder) {
  const value: BrandOrder = order === "manual" ? "manual" : "az";
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ brand_order: value, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: error.message };
  return afterSiteWrite();
}

export async function saveSiteSettings(faviconUrl: string, heroMode: HeroMode) {
  const mode: HeroMode = heroMode === "both" ? "both" : "replace";
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      favicon_url: faviconUrl.trim(),
      hero_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  return afterSiteWrite();
}

export async function createBanner() {
  const supabase = await createClient();
  const position = await nextPosition(supabase, "banners");
  const { error } = await supabase
    .from("banners")
    .insert({ title: "Novo banner", position });
  if (error) return { error: error.message };
  return afterSiteWrite();
}

export async function updateBanner(
  id: string,
  patch: {
    title?: string;
    subtitle?: string;
    tag_id?: string | null;
    image_url?: string;
    visible?: boolean;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").update(patch).eq("id", id);
  if (error) return { error: error.message };
  return afterSiteWrite();
}

export async function moveBanner(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const error = await moveWithin(supabase, "banners", id, direction, "created_at");
  if (error) return { error };
  return afterSiteWrite();
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { error: error.message };
  return afterSiteWrite();
}

// ---------- Coupons ----------

function afterCouponWrite() {
  revalidatePath("/admin/cupons");
  return { error: null };
}

export async function createCoupon(code: string, percent: number) {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 3) return { error: "Informe um código com ao menos 3 caracteres." };
  const n = Math.trunc(Number(percent));
  if (!Number.isFinite(n) || n < 1 || n > 90) return { error: "Informe um desconto entre 1% e 90%." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("coupons")
    .select("id")
    .ilike("code", trimmed)
    .maybeSingle();
  if (existing) return { error: "Cupom já cadastrado." };
  const { error } = await supabase.from("coupons").insert({ code: trimmed, percent: n });
  if (error) return { error: error.message };
  return afterCouponWrite();
}

export async function updateCoupon(id: string, patch: { percent?: number; active?: boolean }) {
  if (patch.percent != null) {
    const n = Math.trunc(Number(patch.percent));
    if (!Number.isFinite(n) || n < 1 || n > 90) {
      return { error: "Informe um desconto entre 1% e 90%." };
    }
    patch = { ...patch, percent: n };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update(patch).eq("id", id);
  if (error) return { error: error.message };
  return afterCouponWrite();
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { error: error.message };
  return afterCouponWrite();
}

/**
 * Checks one code for a shopper.
 *
 * The table is unreadable to visitors on purpose, so this is the only way in
 * from the storefront — and it answers about a single code rather than handing
 * back the list.
 */
export async function applyCoupon(code: string) {
  return checkCoupon(code);
}

// ---------- Seller settings ----------

export async function saveSellerSettings(formData: FormData) {
  const supabase = await createClient();
  const phoneDigits = String(formData.get("phone") ?? "").replace(/\D/g, "");
  if (phoneDigits.length < 12) return { error: "Informe um número com DDI e DDD." };

  const { error } = await supabase
    .from("seller_settings")
    .update({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      send_photos: formData.get("send_photos") === "on",
      send_sizes: formData.get("send_sizes") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidateTag(SELLER_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/vendedor");
  return { error: null };
}

// ---------- Orders ----------

export async function createOrder(items: OrderItem[]): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({ items })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar o pedido.");
  return data.id as string;
}
