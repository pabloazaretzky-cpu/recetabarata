import type { IngredientCategory } from "@/lib/types";

// Mercadona category IDs relevant to each ingredient category
const CATEGORY_MAP: Record<IngredientCategory, number[]> = {
  verduras: [29, 28],
  frutas: [27],
  carnes: [38, 37, 40, 42, 44],
  pescados: [31, 32, 36],
  lácteos: [77, 72, 75, 53, 54, 56],
  cereales: [118, 120, 59, 60, 62, 69],
  especias: [115, 112],
  otros: [112, 121, 89, 90, 133, 116, 117, 122, 126],
};

interface PriceInstructions {
  unit_price: number | string;
  reference_price: number | string;
  unit_size: number | string;
  size_format: string;
  reference_format: string;
}

interface MercadonaProduct {
  id: string | number;
  display_name: string;
  price_instructions: PriceInstructions;
}

interface MercadonaSubcategory {
  products?: MercadonaProduct[];
}

interface MercadonaCategoryResponse {
  categories?: MercadonaSubcategory[];
}

// Module-level cache — persists for the Node.js process lifetime (cleared on deploy)
const productCache = new Map<number, MercadonaProduct[]>();

async function fetchCategoryProducts(catId: number): Promise<MercadonaProduct[]> {
  if (productCache.has(catId)) return productCache.get(catId)!;

  try {
    const res = await fetch(
      `https://tienda.mercadona.es/api/categories/${catId}/`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) {
      productCache.set(catId, []);
      return [];
    }
    const data: MercadonaCategoryResponse = await res.json();
    const products = (data.categories ?? []).flatMap((sub) => sub.products ?? []);
    productCache.set(catId, products);
    return products;
  } catch {
    productCache.set(catId, []);
    return [];
  }
}

const BRAND_WORDS = new Set([
  "hacendado", "deliplus", "bosque", "verde", "compy",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBrands(words: string[]): string[] {
  return words.filter((w) => !BRAND_WORDS.has(w));
}

function scoreMatch(ingName: string, productName: string): number {
  const ingWords = normalize(ingName).split(" ").filter((w) => w.length > 2);
  if (!ingWords.length) return 0;
  const prodWords = stripBrands(
    normalize(productName).split(" ").filter((w) => w.length > 2)
  );
  if (!prodWords.length) return 0;
  const matches = ingWords.filter((w) => prodWords.some((p) => p.includes(w) || w.includes(p))).length;
  const recall = matches / ingWords.length;
  const precision = matches / prodWords.length;
  if (recall + precision === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

function toNum(v: number | string | undefined): number {
  if (v === undefined || v === null) return 0;
  return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export interface MercadonaPriceResult {
  price: number;       // €/kg, €/L, or €/ud — matches ingredient's priceUnit
  productName: string;
}

export async function findMercadonaPrice(
  ingredientName: string,
  category: IngredientCategory,
  priceUnit: "kg" | "L" | "ud"
): Promise<MercadonaPriceResult | null> {
  const catIds = CATEGORY_MAP[category] ?? [];
  if (!catIds.length) return null;

  const allProducts = (await Promise.all(catIds.map(fetchCategoryProducts))).flat();

  let best: MercadonaProduct | null = null;
  let bestScore = 0;

  for (const product of allProducts) {
    const score = scoreMatch(ingredientName, product.display_name);
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  if (!best || bestScore < 0.3) return null;

  const pi = best.price_instructions;
  const refFmt = (pi.reference_format ?? "").toLowerCase();
  const unitSize = toNum(pi.unit_size);

  let price = 0;

  if (priceUnit === "kg") {
    if (refFmt === "kg") price = toNum(pi.reference_price);
    else if (refFmt === "100g") price = toNum(pi.reference_price) * 10;
    else if (unitSize > 0) price = toNum(pi.unit_price) / unitSize;
    else price = toNum(pi.reference_price);
  } else if (priceUnit === "L") {
    if (refFmt === "l") price = toNum(pi.reference_price);
    else if (refFmt === "cl") price = toNum(pi.reference_price) * 100;
    else if (unitSize > 0) price = toNum(pi.unit_price) / unitSize;
    else price = toNum(pi.reference_price);
  } else {
    // priceUnit === "ud"
    if (unitSize > 0) price = toNum(pi.unit_price) / unitSize;
    else price = toNum(pi.unit_price);
  }

  if (price <= 0) return null;

  return { price, productName: best.display_name };
}
