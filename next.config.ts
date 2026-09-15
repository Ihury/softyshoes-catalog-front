import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The grid is fluid now — columns are at least 150px on a phone and 200px
    // on a desktop — so these are the widths the layout actually asks for. The
    // default ladder generates a dozen sizes nothing ever requests.
    imageSizes: [60, 72, 96, 150, 185, 200, 256, 384],
    deviceSizes: [430, 640, 828, 1080, 1280, 1920],
    formats: ["image/avif", "image/webp"],
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
