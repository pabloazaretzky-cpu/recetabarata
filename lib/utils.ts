import type {
  AggregatedIngredient,
  CartItem,
  Ingredient,
  Recipe,
  SupermarketId,
  SupermarketResult,
} from "@/lib/types";
import { recipes } from "@/lib/data/recipes";
import {
  supermarkets,
  PRICE_MULTIPLIERS,
} from "@/lib/data/supermarkets";

export function calcIngredientCost(
  ingredient: Ingredient,
  amount: number
): number {
  const { basePrice, priceUnit, unit } = ingredient;
  if (unit === "g" && priceUnit === "kg") return (amount / 1000) * basePrice;
  if (unit === "ml" && priceUnit === "L") return (amount / 1000) * basePrice;
  if (unit === "ud" && priceUnit === "ud") return amount * basePrice;
  return 0;
}

export function aggregateIngredients(
  cartItems: CartItem[]
): AggregatedIngredient[] {
  const map = new Map<string, AggregatedIngredient>();

  for (const cartItem of cartItems) {
    const recipe = recipes.find((r) => r.id === cartItem.recipeId);
    if (!recipe) continue;

    const multiplier = cartItem.servings / recipe.baseServings;

    for (const ingredient of recipe.ingredients) {
      const scaled = ingredient.amount * multiplier;

      if (map.has(ingredient.id)) {
        const existing = map.get(ingredient.id)!;
        map.set(ingredient.id, {
          ...existing,
          scaledAmount: existing.scaledAmount + scaled,
        });
      } else {
        map.set(ingredient.id, {
          ...ingredient,
          scaledAmount: scaled,
        });
      }
    }
  }

  return Array.from(map.values());
}

// priceOverrides: ingredientId → real €/kg, €/L, or €/ud from Mercadona API
export function calcSupermarketPrices(
  ingredients: AggregatedIngredient[],
  priceOverrides: Record<string, number> = {}
): SupermarketResult[] {
  return supermarkets.map((sm) => {
    const multipliers = PRICE_MULTIPLIERS[sm.id];
    const totalPrice = ingredients.reduce((sum, ing) => {
      const effectivePrice = priceOverrides[ing.id] ?? ing.basePrice;
      const baseCost = calcIngredientCost({ ...ing, basePrice: effectivePrice }, ing.scaledAmount);
      const categoryMultiplier = multipliers[ing.category];
      return sum + baseCost * categoryMultiplier;
    }, 0);

    return {
      id: sm.id,
      name: sm.name,
      logo: sm.logo,
      color: sm.color,
      bgColor: sm.bgColor,
      totalPrice,
      distance: sm.distance,
      address: sm.address,
    };
  });
}

export function getSmIngredientBreakdown(
  ingredients: AggregatedIngredient[],
  smId: SupermarketId,
  priceOverrides: Record<string, number> = {}
): Array<{ id: string; name: string; cost: number }> {
  const multipliers = PRICE_MULTIPLIERS[smId];
  return ingredients
    .map((ing) => {
      const effectivePrice = priceOverrides[ing.id] ?? ing.basePrice;
      const baseCost = calcIngredientCost({ ...ing, basePrice: effectivePrice }, ing.scaledAmount);
      return { id: ing.id, name: ing.name, cost: baseCost * multipliers[ing.category] };
    })
    .filter((item) => item.cost > 0);
}

export function estimateRecipeCost(recipe: Recipe, servings: number): number {
  const multiplier = servings / recipe.baseServings;
  return recipe.ingredients.reduce(
    (sum, ing) => sum + calcIngredientCost(ing, ing.amount * multiplier),
    0
  );
}

export function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",") + " €";
}

export function formatAmount(amount: number, unit: string): string {
  if (unit === "g" && amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, "")} kg`;
  }
  if (unit === "ml" && amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, "")} L`;
  }
  const rounded = Math.round(amount * 10) / 10;
  return `${rounded} ${unit}`;
}
