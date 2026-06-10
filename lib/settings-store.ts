"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  defaultServings: number;
  setDefaultServings: (n: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultServings: 2,
      setDefaultServings: (n) => set({ defaultServings: n }),
    }),
    { name: "recetafacil-settings" }
  )
);
