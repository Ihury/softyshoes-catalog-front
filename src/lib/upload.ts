"use client";

import { createClient } from "@/lib/supabase/client";

/** Catalog photos never render wider than the 1280px container, and the hero
 *  tops out around 640 CSS px, so anything past this is downloaded for nothing. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A phone camera file is 3-8 MB of 4000px JPEG; the catalog shows it at a few
 * hundred pixels. Resizing here turns a slow upload into a fast one and keeps
 * the stored asset small for every visitor afterwards. If anything about the
 * decode fails the original file is used, so a rare format never blocks a save.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY)
    );
    // Keep the original when the re-encode somehow came out larger.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export type UploadResult = { url: string | null; error: string | null };

/**
 * Uploads straight from the browser to Supabase Storage.
 *
 * The previous path sent the file through a Server Action, so every photo made
 * two trips — browser to the Vercel function, then function to storage — with
 * the bytes serialized through the action protocol in between. The admin is
 * already signed in here and the bucket's RLS lets an authenticated writer in,
 * so the browser can talk to storage directly.
 */
export async function uploadPhoto(
  file: File,
  bucket: "product-photos" | "site-media" = "product-photos"
): Promise<UploadResult> {
  try {
    const blob = await shrink(file);
    const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg");
    const path = `${crypto.randomUUID()}.${ext}`;

    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type || file.type,
      upsert: false,
    });
    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : "Não foi possível enviar a foto." };
  }
}
