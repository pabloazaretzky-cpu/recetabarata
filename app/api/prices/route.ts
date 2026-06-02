import { NextRequest, NextResponse } from "next/server";
import { recipes } from "@/lib/data/recipes";
import { findMercadonaPrice } from "@/lib/mercadona";
import { findAwinPrice, makeSearchUrl, isAwinActive } from "@/lib/awin";
import type { SupermarketId } from "@/lib/types";

export const revalidate = 3600;

const AWIN_SUPERMARKETS: SupermarketId[] = ["carrefour", "alcampo", "lidl", "dia"];

export async function GET(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipe_id");
  if (!recipeId) {
    return NextResponse.json({ error: "recipe_id required" }, { status: 400 });
  }

  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const entries = await Promise.all(
    recipe.ingredients.map(async (ing) => {
      // Mercadona: real prices from their API
      const mercadona = await findMercadonaPrice(
        ing.name,
        ing.category,
        ing.priceUnit as "kg" | "L" | "ud"
      );

      // Other supermarkets: real prices from Awin feeds (when configured)
      const awinResults = isAwinActive()
        ? await Promise.all(
            AWIN_SUPERMARKETS.map(async (smId) => {
              const match = await findAwinPrice(ing.name, ing.category, smId);
              return [smId, match] as const;
            })
          )
        : [];

      // Always include search URLs so the UI can link to each supermarket
      const searchUrls = Object.fromEntries(
        (["mercadona", ...AWIN_SUPERMARKETS] as SupermarketId[]).map((smId) => [
          smId,
          makeSearchUrl(smId, ing.name),
        ])
      );

      return [
        ing.id,
        {
          mercadona: mercadona ?? null,
          awin: Object.fromEntries(awinResults),
          searchUrls,
        },
      ] as const;
    })
  );

  return NextResponse.json(Object.fromEntries(entries), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
