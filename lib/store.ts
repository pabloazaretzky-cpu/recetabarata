"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  addRecipe: (recipeId: string, servings: number) => void;
  removeRecipe: (recipeId: string) => void;
  updateServings: (recipeId: string, servings: number) => void;
  isInCart: (recipeId: string) => boolean;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addRecipe: (recipeId, servings) =>
        set((state) => {
          const exists = state.items.some((i) => i.recipeId === recipeId);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.recipeId === recipeId ? { ...i, servings } : i
              ),
            };
          }
          return { items: [...state.items, { recipeId, servings }] };
        }),

      removeRecipe: (recipeId) =>
        set((state) => ({
          items: state.items.filter((i) => i.recipeId !== recipeId),
        })),

      updateServings: (recipeId, servings) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.recipeId === recipeId ? { ...i, servings } : i
          ),
        })),

      isInCart: (recipeId) => get().items.some((i) => i.recipeId === recipeId),

      clear: () => set({ items: [] }),
    }),
    { name: "recetas-cart" }
  )
);
