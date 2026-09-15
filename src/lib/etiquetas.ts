import type { EtiquetaStyle, ProductEtiqueta } from "@/lib/types";

/**
 * What a model shows when it carries no etiqueta.
 *
 * This is today's behaviour, and it is deliberately not the same on both
 * surfaces: the card flips between the dark and the light glass, while the
 * product page draws dark either way. Unifying them here would silently
 * restyle every model that has no etiqueta yet.
 */
export function fallbackEtiqueta(
  promotion: boolean,
  surface: "card" | "hero"
): { name: string; style: EtiquetaStyle } {
  if (promotion) return { name: "Promoção", style: "escuro" };
  return { name: "Disponível", style: surface === "card" ? "claro" : "escuro" };
}

/**
 * The one etiqueta a card, a carousel item or the home highlight shows: the
 * first the seller put on the model, or the fallback when there is none.
 */
export function principalEtiqueta(
  etiquetas: ProductEtiqueta[] | undefined,
  promotion: boolean,
  surface: "card" | "hero"
): { name: string; style: EtiquetaStyle } {
  const first = (etiquetas ?? [])[0];
  return first ? { name: first.name, style: first.style } : fallbackEtiqueta(promotion, surface);
}

/**
 * Every etiqueta the product page shows. A model with none falls back to the
 * single default chip, so the row is never empty.
 */
export function allEtiquetas(
  etiquetas: ProductEtiqueta[] | undefined,
  promotion: boolean
): { name: string; style: EtiquetaStyle }[] {
  const list = etiquetas ?? [];
  if (list.length) return list.map((e) => ({ name: e.name, style: e.style }));
  return [fallbackEtiqueta(promotion, "hero")];
}
