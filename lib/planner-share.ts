import type { NutritionalGoal, Difficulty, WeekDay, MealType, MealSlot } from "./types";

export interface SharedPlan {
  goal: NutritionalGoal;
  difficulty: Difficulty | null;
  budget: number | null;
  slots: MealSlot[];
}

export function encodePlan(plan: SharedPlan): string {
  const compact = {
    g: plan.goal,
    d: plan.difficulty,
    b: plan.budget,
    s: plan.slots.map((sl) => [sl.day, sl.meal, sl.recipeId, sl.servings]),
  };
  return btoa(JSON.stringify(compact))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodePlan(encoded: string): SharedPlan | null {
  try {
    const json = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return {
      goal: data.g ?? "libre",
      difficulty: data.d ?? null,
      budget: data.b ?? null,
      slots: (data.s ?? []).map(
        ([day, meal, recipeId, servings]: [WeekDay, MealType, string, number]) => ({
          day,
          meal,
          recipeId,
          servings,
        })
      ),
    };
  } catch {
    return null;
  }
}
