import type { NutritionalGoal, MealType, Difficulty, Recipe } from "./types";

export const GOAL_CONFIG: Record<NutritionalGoal, { label: string; emoji: string; description: string }> = {
  libre:           { label: "Sin objetivo",      emoji: "🍽️", description: "Todas las recetas" },
  "bajo-calorias": { label: "Bajo en calorías",  emoji: "🥗", description: "Menos de 400 kcal" },
  "alto-proteina": { label: "Alto en proteína",  emoji: "💪", description: "Rico en proteínas" },
  vegano:          { label: "Vegano",            emoji: "🌱", description: "Sin carne ni pescado" },
  mediterraneo:    { label: "Mediterráneo",      emoji: "🫒", description: "Cocina española e italiana" },
};

export function filterByMealType(recipes: Recipe[], meal: MealType): Recipe[] {
  return recipes.filter((r) => {
    const tags = r.tags.map((t) => t.toLowerCase());

    const isBreakfast = tags.includes("desayuno");
    const isLunch     = tags.some((t) => ["almuerzo", "comida"].includes(t));
    const isDinner    = tags.includes("cena");
    const isSnack     = tags.some((t) => ["snack", "merienda"].includes(t));
    const hasMealTag  = isBreakfast || isLunch || isDinner || isSnack;

    switch (meal) {
      case "desayuno": return isBreakfast;
      case "snack":    return isSnack || isBreakfast;
      // Generic recipes (no meal tag) go to lunch and dinner, not breakfast/snack
      case "almuerzo": return isLunch || !hasMealTag;
      case "cena":     return isDinner || !hasMealTag;
    }
  });
}

const DIFFICULTY_INCLUDES: Record<Difficulty, Difficulty[]> = {
  "fácil":   ["fácil"],
  "media":   ["fácil", "media"],
  "difícil": ["fácil", "media", "difícil"],
};

export function filterByDifficulty(recipes: Recipe[], difficulty: Difficulty | null): Recipe[] {
  if (!difficulty) return recipes;
  const allowed = DIFFICULTY_INCLUDES[difficulty];
  return recipes.filter((r) => allowed.includes(r.difficulty));
}

export function filterByGoal(recipes: Recipe[], goal: NutritionalGoal): Recipe[] {
  switch (goal) {
    case "bajo-calorias":
      return recipes.filter((r) => r.calories < 400);
    case "alto-proteina":
      return recipes.filter(
        (r) =>
          r.ingredients.some((i) => i.category === "carnes" || i.category === "pescados") ||
          r.tags.some((t) => t.toLowerCase().includes("proteína"))
      );
    case "vegano":
      return recipes.filter(
        (r) =>
          r.category === "vegana" ||
          r.tags.some((t) => ["vegetariano", "vegano"].includes(t.toLowerCase()))
      );
    case "mediterraneo":
      return recipes.filter((r) => ["espanola", "italiana"].includes(r.category));
    default:
      return recipes;
  }
}
