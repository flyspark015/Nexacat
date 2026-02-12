import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./types";

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const quantity = item.quantity || 1;
        
        set((state) => {
          // For simple products, match by productId
          // For variable products, match by productId AND variationId
          const existingItem = state.items.find((cartItem) => {
            if (item.productType === "variable") {
              return (
                cartItem.productId === item.productId &&
                cartItem.variationId === item.variationId
              );
            }
            return cartItem.productId === item.productId;
          });

          if (existingItem) {
            // Update quantity
            return {
              items: state.items.map((cartItem) =>
                (cartItem.productType === "variable"
                  ? cartItem.productId === item.productId &&
                    cartItem.variationId === item.variationId
                  : cartItem.productId === item.productId)
                  ? { ...cartItem, quantity: cartItem.quantity + quantity }
                  : cartItem
              ),
            };
          } else {
            // Add new item
            return {
              items: [...state.items, { ...item, quantity }],
            };
          }
        });
      },

      removeItem: (productId, variationId) => {
        set((state) => ({
          items: state.items.filter((item) => {
            if (variationId) {
              return !(item.productId === productId && item.variationId === variationId);
            }
            return item.productId !== productId;
          }),
        }));
      },

      updateQuantity: (productId, quantity, variationId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variationId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (variationId) {
              return item.productId === productId && item.variationId === variationId
                ? { ...item, quantity }
                : item;
            }
            return item.productId === productId ? { ...item, quantity } : item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "flyspark-cart-storage",
    }
  )
);
