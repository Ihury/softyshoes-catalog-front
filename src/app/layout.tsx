import type { Metadata } from "next";
import { neueMontreal } from "@/lib/fonts";
import { getPublicSiteSettings } from "@/lib/catalog";
import "./globals.css";

/**
 * The tab icon is a seller setting, so the head has to be built rather than
 * declared: `metadata` and `generateMetadata` cannot both be exported, and the
 * icon is the reason this one is a function.
 *
 * The SOFTY mark is served from `public/` rather than through Next's
 * `app/icon.svg` convention. That convention emits its own `<link rel="icon">`
 * on top of this one, so a seller who set an icon got two links in the head and
 * whichever the browser preferred — this way there is exactly one, and setting
 * an icon actually replaces the default instead of joining it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteSettings();
  const favicon = site.favicon_url.trim();
  return {
    title: "SOFTY",
    description: "Selection house de calçados essenciais para a rotina urbana.",
    icons: { icon: favicon || "/icon.svg" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${neueMontreal.variable} h-full`}>
      <body className="min-h-full bg-paper text-ink overscroll-none">{children}</body>
    </html>
  );
}
