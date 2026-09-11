import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The catalog grid is 2 columns on a phone and 4 on a desktop, so the
    // default breakpoint ladder generates sizes the layout never asks for.
    imageSizes: [96, 161, 236, 256, 384],
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
