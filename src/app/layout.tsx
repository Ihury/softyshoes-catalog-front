import type { Metadata } from "next";
import { neueMontreal } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOFTY",
  description: "Selection house de calçados essenciais para a rotina urbana.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${neueMontreal.variable} h-full`}>
      <body className="min-h-full bg-paper text-ink overscroll-none">{children}</body>
    </html>
  );
}
