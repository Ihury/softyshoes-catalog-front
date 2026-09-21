export type Brand = {
  id: string;
  name: string;
  /** Where the brand sits when the seller sorts the list by hand. */
  position: number;
  created_at: string;
};

/** What a tab actually shows. The rule decides, never the label — the seller
 *  can call a tab anything and it keeps behaving the same. */
export type FilterRule = "todos" | "promo" | "disp" | "ped";

/** A seller-defined tab. The storefront's tab bar is exactly this list, in this
 *  order — "Todos" included, which is a row now rather than a constant. */
export type Filter = {
  id: string;
  name: string;
  rule: FilterRule;
  position: number;
};

/** How the admin names each rule while picking one. */
export const RULE_LABELS: Record<FilterRule, string> = {
  todos: "Tudo",
  promo: "Promoção",
  disp: "Disponíveis",
  ped: "Pedidos",
};

export const FILTER_RULES = ["todos", "promo", "disp", "ped"] as const;

/** The finish of the label drawn over a photo. */
export type EtiquetaStyle = "escuro" | "claro" | "preto" | "branco";

export const ETIQUETA_STYLES = ["escuro", "claro", "preto", "branco"] as const;

export const ETIQUETA_STYLE_LABELS: Record<EtiquetaStyle, string> = {
  escuro: "Glass escuro",
  claro: "Glass claro",
  preto: "Preto",
  branco: "Branco",
};

/** An entry in the etiqueta registry. */
export type Etiqueta = {
  id: string;
  name: string;
  style: EtiquetaStyle;
  position: number;
};

/** What a product carries, in order. The first one is the principal: the chip
 *  on the card, the carousel and the hero. The registry's own `position` is not
 *  part of this — the order here belongs to the product. */
export type ProductEtiqueta = Pick<Etiqueta, "id" | "name" | "style">;

export type Product = {
  id: string;
  /** The product's address on the storefront: a readable stand-in for the id,
   *  derived from the name when the model is created and stable from then on
   *  so a shared link never stops working. */
  slug: string;
  name: string;
  brand_id: string | null;
  price: number;
  old_price: number | null;
  description: string;
  spec: string;
  sizes: number[];
  promotion: boolean;
  available: boolean;
  featured: boolean;
  ordered: boolean;
  reaction_count: number;
  photos: string[];
  /** Where the model sits in the seller's manual catalog order. */
  position: number;
  created_at: string;
  updated_at: string;
  brand?: Brand | null;
  etiquetas?: ProductEtiqueta[];
};

/**
 * Coerces a list column into a real array.
 *
 * `photos` is `jsonb` and `sizes` is `int4[]`, so a row written by hand (or by
 * a migration) can hold something that is not a list — a `'{}'::jsonb` is an
 * empty *object*, not an empty array. Reads normalize here so a single bad row
 * can never take a page down with "map is not a function".
 */
export function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const STYLE_SET = new Set<string>(ETIQUETA_STYLES);

type EtiquetaLink = { position: number; tag: ProductEtiqueta | null };

/**
 * Shapes the etiqueta embed into an ordered list.
 *
 * Anything without a real finish is dropped rather than rendered: a link to a
 * row that is not an etiqueta — or not one yet, mid-migration — has to fall
 * back to the default chip, never paint an unstyled label and never throw.
 */
export function normalizeEtiquetas(value: unknown): ProductEtiqueta[] {
  return asList<EtiquetaLink>(value)
    .filter(
      (l): l is EtiquetaLink & { tag: ProductEtiqueta } =>
        !!l && !!l.tag && STYLE_SET.has(l.tag.style)
    )
    .sort((a, b) => a.position - b.position)
    .map((l) => l.tag);
}

/**
 * Shapes a `products` row that was read with its etiqueta embed.
 *
 * Both readers go through this so the storefront and the admin can never
 * disagree about what a product looks like.
 */
export function normalizeProductRow(row: unknown): Product {
  const r = row as Product & { product_tags?: unknown };
  return {
    ...r,
    photos: asList<string>(r.photos),
    sizes: asList<number>(r.sizes),
    etiquetas: normalizeEtiquetas(r.product_tags),
  };
}

/**
 * What a catalog card actually renders. The listing queries select only these
 * columns — `description` and `spec` are long free text that would otherwise
 * ride along in every card and get serialized into the RSC payload for
 * nothing.
 */
export type CatalogItem = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "price"
  | "old_price"
  | "photos"
  | "promotion"
  | "available"
  | "ordered"
  | "featured"
> & {
  brand?: Pick<Brand, "id" | "name"> | null;
  /** Names and finishes, not just ids: the card draws the principal etiqueta,
   *  so resolving it from a registry would mean shipping the registry too. */
  etiquetas?: ProductEtiqueta[];
};

export type SellerSettings = {
  id: number;
  name: string;
  phone: string;
  message: string;
  send_photos: boolean;
  send_sizes: boolean;
  updated_at: string;
};

/** Which slot the home highlight gives to the banners. */
export type HeroMode = "replace" | "both";

/** How the brand menu is ordered, on the storefront as well as in the admin. */
export type BrandOrder = "az" | "manual";

export type SiteSettings = {
  id: number;
  favicon_url: string;
  hero_mode: HeroMode;
  brand_order: BrandOrder;
  updated_at: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  tag_id: string | null;
  image_url: string;
  visible: boolean;
  position: number;
  /** Resolved from `tag_id` so the carousel can draw the chip without a second
   *  lookup. Absent when the banner carries no etiqueta. */
  tag?: ProductEtiqueta | null;
};

export type Coupon = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
};

export type OrderItem = {
  product_id: string;
  name: string;
  size: number;
  qty: number;
  unit_price: number;
  photo: string | null;
};

export type Order = {
  id: string;
  items: OrderItem[];
  created_at: string;
};

/** Fallback numbering, used only if the seller empties the global list. The
 *  real list lives in `catalog_sizes`. */
export const SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44];

/**
 * The grid a model shows: every number the seller registered, plus whatever
 * this model carries that is not in the global list — a boot in 46 still has to
 * render, even though nobody else stocks one.
 */
export function sizeGridFor(globalSizes: number[], productSizes: number[]): number[] {
  return [...new Set([...globalSizes, ...productSizes])].sort((a, b) => a - b);
}
