import RecipeGrid from "@/components/RecipeGrid";
import { recipes } from "@/lib/data/recipes";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { RatingStats } from "@/lib/types";

async function fetchRatingsMap(): Promise<Record<string, RatingStats>> {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase!.from("reviews").select("recipe_id, rating");
  if (!data) return {};
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!acc[row.recipe_id]) acc[row.recipe_id] = { sum: 0, count: 0 };
    acc[row.recipe_id].sum += row.rating;
    acc[row.recipe_id].count += 1;
  }
  return Object.fromEntries(
    Object.entries(acc).map(([id, { sum, count }]) => [id, { avg: sum / count, count }])
  );
}

export default async function Home() {
  const ratingsMap = await fetchRatingsMap();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-3">
          Cocina sin complicaciones
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Elige tu receta, define las porciones y nosotros armamos la lista de
          compras con los mejores precios del barrio.
        </p>
      </div>

      {/* Recipe grid with search + filter */}
      <RecipeGrid recipes={recipes} ratingsMap={ratingsMap} />
    </div>
  );
}
