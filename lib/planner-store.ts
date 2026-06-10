"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MealSlot, NutritionalGoal, MealType, WeekDay, Difficulty } from "./types";

interface PlannerStore {
  goal: NutritionalGoal;
  difficulty: Difficulty | null;
  slots: MealSlot[];
  budget: number | null;
  setGoal: (goal: NutritionalGoal) => void;
  setDifficulty: (d: Difficulty | null) => void;
  setSlot: (day: WeekDay, meal: MealType, recipeId: string, servings: number) => void;
  clearSlot: (day: WeekDay, meal: MealType) => void;
  clearAll: () => void;
  setBudget: (budget: number | null) => void;
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      goal: "libre",
      difficulty: null,
      slots: [],
      budget: null,

      setGoal: (goal) => set({ goal }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setBudget: (budget) => set({ budget }),

      setSlot: (day, meal, recipeId, servings) =>
        set((state) => ({
          slots: [
            ...state.slots.filter((s) => !(s.day === day && s.meal === meal)),
            { day, meal, recipeId, servings },
          ],
        })),

      clearSlot: (day, meal) =>
        set((state) => ({
          slots: state.slots.filter((s) => !(s.day === day && s.meal === meal)),
        })),

      clearAll: () => set({ slots: [] }),
    }),
    { name: "recetafacil-planner" }
  )
);
