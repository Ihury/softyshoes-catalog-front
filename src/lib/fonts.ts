import localFont from "next/font/local";

export const neueMontreal = localFont({
  src: [
    { path: "../fonts/ppneuemontreal-thin.otf", weight: "200", style: "normal" },
    { path: "../fonts/ppneuemontreal-book.otf", weight: "300", style: "normal" },
    { path: "../fonts/ppneuemontreal-medium.otf", weight: "400", style: "normal" },
    { path: "../fonts/ppneuemontreal-bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/ppneuemontreal-italic.otf", weight: "300", style: "italic" },
    { path: "../fonts/ppneuemontreal-semibolditalic.otf", weight: "600", style: "italic" },
  ],
  variable: "--font-inst",
  display: "swap",
});
