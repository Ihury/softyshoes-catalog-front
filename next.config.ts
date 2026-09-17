import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
