import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every photo is served as stored, straight from Supabase, and Vercel's
    // optimiser is not called at all.
    //
    // The Hobby plan caps image transformations per month, and once the cap is
    // reached every size not already in the cache answers 402
    // OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED — a broken image on the page,
    // not a slower one. New photos broke first, because nothing about them is
    // cached. Raising `quality` to 85 had changed the cache key of every
    // derivative, so the whole catalog was regenerated inside one cycle, and
    // that is very likely what ran the cap out.
    //
    // The price is weight: a card now downloads the stored file rather than a
    // card-sized AVIF. To bring the optimiser back — on a plan whose quota
    // covers the catalog — delete this line; everything below is still set.
    unoptimized: true,
    // The grid is fluid now — columns are at least 150px on a phone and 200px
    // on a desktop — so these are the widths the layout actually asks for. The
    // default ladder generates a dozen sizes nothing ever requests.
    imageSizes: [60, 72, 96, 150, 185, 200, 256, 384],
    deviceSizes: [430, 640, 828, 1080, 1280, 1920],
    formats: ["image/avif", "image/webp"],
    // Next 16 only serves qualities named here and coerces anything else to the
    // nearest entry, so a `quality` prop missing from this list is silently
    // ignored. 85 is where AVIF stops visibly smoothing texture; measured on a
    // 640px card it buys 1.2 dB over the built-in 75, and the next step up to
    // 90 costs another 72% in bytes for a gain the eye does not collect.
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vesfypqltbiwnhytmtnk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Keeps a visited filter/search in the client router cache, so going back
    // to a tab the visitor already opened renders from memory with no server
    // round-trip at all.
    staleTimes: { dynamic: 120, static: 300 },
  },
};

export default nextConfig;
