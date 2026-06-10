export type CategoryId =
  | "rapidas"
  | "espanola"
  | "asiatica"
  | "japonesa"
  | "italiana"
  | "vegana";

export type SupermarketId =
  | "mercadona"
  | "carrefour"
  | "lidl"
  | "dia"
  | "alcampo";

export type Difficulty = "fácil" | "media" | "difícil";

export type IngredientCategory =
  | "verduras"
  | "frutas"
  | "carnes"
  | "pescados"
  | "lácteos"
  | "cereales"
  | "especias"
  | "otros";

export type PriceUnit = "kg" | "L" | "ud";
export type AmountUnit = "g" | "ml" | "ud";

export interface Ingredient {
  id: string;
  name: string;
  amount: number;       // per base serving
  unit: AmountUnit;
  category: IngredientCategory;
  basePrice: number;    // euros per priceUnit
  priceUnit: PriceUnit;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  category: CategoryId;
  tags: string[];
  prepTime: number;
  cookTime: number;
  baseServings: number;
  difficulty: Difficulty;
  description: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
  calories: number;
}

export interface CartItem {
  recipeId: string;
  servings: number;
}

export interface AggregatedIngredient extends Ingredient {
  scaledAmount: number;
}

export type MealType = "desayuno" | "almuerzo" | "cena" | "snack";

export type WeekDay =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type NutritionalGoal =
  | "libre"
  | "bajo-calorias"
  | "alto-proteina"
  | "vegano"
  | "mediterraneo";

export interface MealSlot {
  day: WeekDay;
  meal: MealType;
  recipeId: string;
  servings: number;
}

export interface Review {
  id: string;
  recipe_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface RatingStats {
  avg: number;
  count: number;
}

export interface SupermarketResult {
  id: SupermarketId;
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  totalPrice: number;
  distance: string;
  address: string;
}
