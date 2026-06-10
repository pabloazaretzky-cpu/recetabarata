import type { Recipe, IngredientCategory } from "./types";

// Protein in grams per 100g of ingredient (approximate)
const PROTEIN_PER_100G: Record<IngredientCategory, number> = {
  verduras:  2,
  frutas:    1,
  carnes:   22,
  pescados:  20,
  lácteos:   8,
  cereales:  10,
  especias:   3,
  otros:      1,
};

// Protein per unit for "ud" ingredients (by ingredient id)
const PROTEIN_PER_UNIT: Record<string, number> = {
  "huevos":         6,
  "huevo":          6,
  "aguacate":       2,
  "platano":        1,
  "limon":          0.5,
  "limon-lima":     0.5,
  "pepino":         0.5,
  "cebolla":        0.5,
  "cebolla-morada": 0.5,
  "pimiento":       0.5,
  "tomate":         0.5,
  "lata-atun":     26,   // ~130g lata, ~20g proteína/100g
  "lata-sardinas":  25,
};

// Returns estimated protein per serving (same unit as recipe.calories)
export function estimateProteinPerServing(recipe: Recipe): number {
  let total = 0;

  for (const ing of recipe.ingredients) {
    if (ing.unit === "g") {
      total += (ing.amount / 100) * PROTEIN_PER_100G[ing.category];
    } else if (ing.unit === "ml") {
      // Treat ml ≈ g for liquids (density ~1); oils/alcohol have negligible protein
      total += (ing.amount / 100) * PROTEIN_PER_100G[ing.category];
    } else if (ing.unit === "ud") {
      total += (PROTEIN_PER_UNIT[ing.id] ?? 1) * ing.amount;
    }
  }

  return Math.round(total / recipe.baseServings);
}
