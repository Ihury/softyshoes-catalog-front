"use client";

import { createClient } from "@/lib/supabase/client";

/** The widest thing the layout ever paints is the home highlight: 1184 CSS px,
 *  which a 2x screen asks for at 2368. Below that the optimiser has nothing
 *  left to cut from and starts enlarging, which is the softness this number is
 *  here to prevent. Above it the extra pixels are downloaded and thrown away. */
const MAX_EDGE = 2400;
/** A catalog photo is already a lossy file when it arrives, and next/image
 *  re-encodes whatever we store here a second time. At 0.82 the two passes
 *  stacked and fine detail — knit, stitching, suede — did not survive them. */
const QUALITY = 0.92;
/** A photo that already fits inside MAX_EDGE is stored exactly as it arrived up
 *  to this size. Re-encoding it would spend a generation of quality to save
 *  bytes the visitor never downloads anyway, since they are served a derivative. */
const PASSTHROUGH_BYTES = 1_500_000;

/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A phone camera file is 3-8 MB of 4000px JPEG, and no screen ever asks for
 * more than MAX_EDGE of it, so trimming it here turns a slow upload into a fast
 * one. What it must not do is cost quality: visitors are served a derivative
 * next/image builds from this file, so whatever softness is baked in here is
 * softness on every card. If anything about the decode fails the original file
 * is used, so a rare format never blocks a save.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < PASSTHROUGH_BYTES) {
      bitmap.close();
      return file;
    }

    // Left on the browser's default resampler on purpose. Measured against a
    // Lanczos-3 reference at the ratios a phone photo actually lands on, it
    // beats `imageSmoothingQuality: "high"` (error 3.5 vs 5.1 at 1.7x, 1.4 vs
    // 7.2 at 2.5x); "high" only pulls ahead past 4x, which needs a 10000px
    // source. Stepwise halving was worse than either.
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
    if (!blob) return file;
    // Once the photo has actually been reduced, keep the reduced one even if it
    // encodes larger — the original is over MAX_EDGE, which is the one thing we
    // came here to fix. Only a same-size re-encode is worth backing out of.
    if (scale === 1 && blob.size >= file.size) return file;
    return blob;
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
