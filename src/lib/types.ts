export type Brand = {
  id: string;
  name: string;
  created_at: string;
};

/** A seller-defined filter. The storefront's tab bar is built from these. */
export type Tag = {
  id: string;
  name: string;
  position: number;
};

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
  created_at: string;
  updated_at: string;
  brand?: Brand | null;
  tag_ids?: string[];
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

/**
 * Shapes a `products` row that was read with its tag embed.
 *
 * Both readers go through this so the storefront and the admin can never
 * disagree about what a product looks like.
 */
export function normalizeProductRow(row: unknown): Product {
  const r = row as Product & { product_tags?: { tag_id: string }[] };
  return {
    ...r,
    photos: asList<string>(r.photos),
    sizes: asList<number>(r.sizes),
    tag_ids: asList<{ tag_id: string }>(r.product_tags).map((t) => t.tag_id),
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
  /** Tag ids only — the card filters by them and never renders their names,
   *  so shipping the names in every card would be dead weight. */
  tag_ids?: string[];
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

export const SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44];

/** The storefront's first tab, always present and never stored as a tag. */
export const ALL_TAB = "Todos";

/**
 * The admin listing's own tabs, which still filter by the product flags.
 * The storefront's tabs are the seller's tags instead — see `Tag`.
 */
export const TABS = ["Todos", "Promoção", "Disponíveis", "Pedidos"] as const;
export type Tab = (typeof TABS)[number];
