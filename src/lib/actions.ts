"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseMoney } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

// ---------- Auth ----------

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
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
  revalidatePath("/admin/marcas");
  revalidatePath("/admin");
  revalidatePath("/");
  return { error: null };
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/marcas");
  revalidatePath("/admin");
  revalidatePath("/");
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

  if (productId) {
    const { error } = await supabase.from("products").update(record).eq("id", productId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").insert(record);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function uploadProductPhoto(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { url: null, error: "Nenhum arquivo enviado." };
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
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
  revalidatePath("/admin/vendedor");
  return { error: null };
}

// ---------- Reactions ----------

export async function registerReaction(productId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_reaction", { p_product_id: productId });
  revalidatePath(`/produto/${productId}`);
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
