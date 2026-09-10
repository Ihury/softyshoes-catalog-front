// The Supabase URL and anon/publishable key are not secrets — they are
// meant to be shipped to the browser, and access is governed by row-level
// security policies. The literals below are this project's values so the
// app works even before NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// are set in the hosting environment; set them there to override.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vesfypqltbiwnhytmtnk.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_5ZqFAbiwAVQ-cASCu_JB6g_hA73wAWk";
