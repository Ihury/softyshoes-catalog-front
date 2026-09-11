"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { brl } from "@/lib/format";

export type CartItem = {
  key: string;
  id: string;
  name: string;
  /** Null for a model with no colourways, which is the normal case. */
  color: string | null;
  size: number;
  unit: number;
  qty: number;
  photo: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  subtotalLabel: string;
  addItem: (item: Omit<CartItem, "key">) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "softy:cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, required to avoid an SSR/CSR mismatch
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart stays in-memory for this session
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, c) => sum + c.unit * c.qty, 0);
    return {
      items,
      // How many distinct models are in the cart, not how many units: four
      // pairs of one model is one model. The same model in two sizes counts
      // once, which is why this keys off the product id rather than the line.
      count: new Set(items.map((c) => c.id)).size,
      subtotal,
      subtotalLabel: brl(subtotal),
      addItem: (item) =>
        setItems((prev) => prev.concat([{ ...item, key: "c" + Date.now() + Math.random().toString(36).slice(2) }])),
      inc: (key) => setItems((prev) => prev.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c))),
      dec: (key) =>
        setItems((prev) => prev.map((c) => (c.key === key ? { ...c, qty: Math.max(1, c.qty - 1) } : c))),
      remove: (key) => setItems((prev) => prev.filter((c) => c.key !== key)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
