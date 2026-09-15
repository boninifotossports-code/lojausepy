import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types/catalog";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  subtotalCents: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            const newQty = Math.min(existing.quantity + item.quantity, existing.maxStock);
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      clear: () => set({ items: [] }),

      subtotalCents: () =>
        get().items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    }),
    { name: "usepy-cart" }
  )
);
