import type { Metadata } from "next";
import { neueMontreal } from "@/lib/fonts";
import { getPublicSiteSettings } from "@/lib/catalog";
import "./globals.css";

/**
 * The tab icon is a seller setting, so the head has to be built rather than
 * declared: `metadata` and `generateMetadata` cannot both be exported, and the
 * icon is the reason this one is a function. With nothing set, no icon is
 * emitted and the browser falls back to its default.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteSettings();
  const favicon = site.favicon_url.trim();
  return {
    title: "SOFTY",
    description: "Selection house de calçados essenciais para a rotina urbana.",
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${neueMontreal.variable} h-full`}>
      <body className="min-h-full bg-paper text-ink overscroll-none">{children}</body>
    </html>
  );
}
