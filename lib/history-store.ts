"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  date: string; // ISO string
  items: Array<{ recipeId: string; servings: number }>;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (items: Array<{ recipeId: string; servings: number }>) => void;
  removeEntry: (id: string) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (items) =>
        set((state) => ({
          entries: [
            { id: Date.now().toString(), date: new Date().toISOString(), items },
            ...state.entries,
          ],
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
    }),
    { name: "recetafacil-history" }
  )
);
