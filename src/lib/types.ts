export type Brand = {
  id: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
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
export const TABS = ["Todos", "Promoção", "Disponíveis", "Pedidos"] as const;
export type Tab = (typeof TABS)[number];
