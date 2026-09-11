import localFont from "next/font/local";

// The handoff calls for book/300 for body copy and medium/400 for values,
// product names and active states — "nada acima de 400 na interface" — so only
// those two faces ship. The full six-weight family lives in the design package
// if a later screen ever needs thin, bold or the italics.
//
// Both faces are subset to Latin and served as WOFF2: 231 KB of OTF becomes
// 52 KB, and next/font preloads them, so text paints without a swap on the
// first view.
export const neueMontreal = localFont({
  src: [
    { path: "../fonts/ppneuemontreal-book.woff2", weight: "300", style: "normal" },
    { path: "../fonts/ppneuemontreal-medium.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-inst",
  display: "swap",
});
