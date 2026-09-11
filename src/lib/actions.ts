"use server";

import { revalidatePath, revalidateTag } from "next/cache";

// Admin writes are rare and whoever saved expects to see the change on the
// storefront right away, so tags expire immediately (`expire: 0`) instead of
// serving stale content for one more request.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseMoney } from "@/lib/format";
import { BRANDS_TAG, CATALOG_TAG, SELLER_TAG, TAGS_TAG } from "@/lib/cache-tags";
import { asList } from "@/lib/types";
import type { OrderItem } from "@/lib/types";

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
 * `/produto/[id]` are prerendered, so without this an admin save would keep
 * serving the old HTML until the revalidate window expired — the seller would
 * edit a model and not see it on the site for five minutes. `layout` covers
 * every page under the storefront tree, the product pages included.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

// ---------- Brands ----------

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
  const { error } = await supabase.from("brands").insert({ name: trimmed });
  if (error) return { error: error.message };
  revalidateTag(BRANDS_TAG, { expire: 0 });
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/marcas");
  revalidatePath("/admin");
  return { error: null };
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTag(BRANDS_TAG, { expire: 0 });
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/marcas");
  revalidatePath("/admin");
  return { error: null };
}

// ---------- Tags ----------

/**
 * Seller-defined filters. These are what the storefront's tab bar is built
 * from, so every write here has to clear the storefront as well as the tag
 * list itself.
 */
export async function createTag(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome da tag." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) return { error: "Tag já cadastrada." };

  // New tags land at the end of the bar rather than jumping to the front.
  // The max is taken here rather than with order+limit: there are only ever a
  // handful of tags, and this cannot be thrown off by how ties are ordered.
  const { data: rows } = await supabase.from("tags").select("position");
  const position =
    asList<{ position: number }>(rows).reduce((max, r) => Math.max(max, r.position ?? 0), 0) + 1;

  const { error } = await supabase.from("tags").insert({ name: trimmed, position });
  if (error) return { error: error.message };
  afterTagWrite();
  return { error: null };
}

export async function renameTag(id: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Informe o nome da tag." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", trimmed)
    .neq("id", id)
    .maybeSingle();
  if (existing) return { error: "Já existe uma tag com esse nome." };
  const { error } = await supabase.from("tags").update({ name: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  afterTagWrite();
  return { error: null };
}

/** Removing a tag unlinks it from every model — `product_tags` cascades — but
 *  never touches the models themselves. */
export async function deleteTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };
  afterTagWrite();
  return { error: null };
}

/** Swaps a tag with its neighbour so the seller can order the tab bar. */
export async function moveTag(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("id,position").order("position").order("name");
  const tags = asList<{ id: string; position: number }>(data);
  const i = tags.findIndex((t) => t.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= tags.length) return { error: null };

  // Positions can be duplicated or all zero in old rows, so rewrite the whole
  // sequence from the reordered list instead of trading two values.
  const reordered = tags.slice();
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  for (let k = 0; k < reordered.length; k++) {
    const { error } = await supabase.from("tags").update({ position: k + 1 }).eq("id", reordered[k].id);
    if (error) return { error: error.message };
  }
  afterTagWrite();
  return { error: null };
}

function afterTagWrite() {
  revalidateTag(TAGS_TAG, { expire: 0 });
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin/tags");
  revalidatePath("/admin");
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
    // The id comes back from the insert because the tags and colours below are
    // separate rows that have to point at it.
    const { data, error } = await supabase.from("products").insert(record).select("id").single();
    if (error || !data) return { error: error?.message ?? "Não foi possível salvar o modelo." };
    savedId = data.id as string;
  }

  const linked = await replaceTags(savedId!, formData.getAll("tags").map(String).filter(Boolean));
  if (linked) return { error: linked };
  const coloured = await replaceColors(savedId!, parseColors(formData.get("colors")));
  if (coloured) return { error: coloured };

  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * Rewrites a model's tag links from scratch.
 *
 * The form always submits the complete set, so replacing is both simpler and
 * more predictable than diffing — and the join table holds nothing but the two
 * ids, so there is nothing to preserve across the swap.
 */
async function replaceTags(productId: string, tagIds: string[]): Promise<string | null> {
  const supabase = await createClient();
  const { error: cleared } = await supabase
    .from("product_tags")
    .delete()
    .eq("product_id", productId);
  if (cleared) return cleared.message;
  if (tagIds.length === 0) return null;
  const { error } = await supabase
    .from("product_tags")
    .insert(tagIds.map((tag_id) => ({ product_id: productId, tag_id })));
  return error ? error.message : null;
}

/**
 * Same wholesale replacement for colourways.
 *
 * Safe to recreate the rows because nothing points at a colour by id — a cart
 * line and an order both record the colour's *name*, so a shopper's basket
 * survives the seller re-saving the model.
 */
async function replaceColors(
  productId: string,
  colors: { name: string; photos: string[] }[]
): Promise<string | null> {
  const supabase = await createClient();
  const { error: cleared } = await supabase
    .from("product_colors")
    .delete()
    .eq("product_id", productId);
  if (cleared) return cleared.message;
  if (colors.length === 0) return null;
  const { error } = await supabase.from("product_colors").insert(
    colors.map((c, i) => ({
      product_id: productId,
      name: c.name,
      photos: c.photos,
      position: i,
    }))
  );
  return error ? error.message : null;
}

/**
 * Reads the colour list the form serialized into a single field.
 *
 * Colours are a nested list of lists, which flat form fields cannot express, so
 * the editor sends JSON. Anything malformed is treated as "no colours" rather
 * than throwing: a bad payload must not be able to wipe a model's save.
 */
function parseColors(raw: FormDataEntryValue | null): { name: string; photos: string[] }[] {
  if (typeof raw !== "string" || !raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  return asList<{ name?: unknown; photos?: unknown }>(parsed)
    .map((c) => ({
      name: String(c.name ?? "").trim(),
      photos: asList<unknown>(c.photos).map(String).filter(Boolean).slice(0, MAX_COLOR_PHOTOS),
    }))
    .filter((c) => c.name.length > 0);
}

/** Matches the per-model limit in the product form. */
const MAX_COLOR_PHOTOS = 15;

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidateStorefront();
  revalidatePath("/admin");
  redirect("/admin");
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

// ---------- Reactions ----------

export async function registerReaction(productId: string) {
  const supabase = await createClient();
  // Deliberately no revalidation: the count is cosmetic, the detail view
  // already bumps it optimistically, and dropping the whole catalog cache on
  // every visitor tap would be far more expensive than a few stale minutes.
  await supabase.rpc("increment_reaction", { p_product_id: productId });
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
