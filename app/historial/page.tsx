"use client";

import Link from "next/link";
import { ArrowLeft, History, Trash2, ChefHat } from "lucide-react";
import { useHistoryStore } from "@/lib/history-store";
import { useCartStore } from "@/lib/store";
import { recipes } from "@/lib/data/recipes";
import { useRouter } from "next/navigation";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HistorialPage() {
  const { entries, removeEntry } = useHistoryStore();
  const { replaceAll } = useCartStore();
  const router = useRouter();

  function handleCookAgain(items: Array<{ recipeId: string; servings: number }>) {
    replaceAll(items);
    router.push("/shopping-list");
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <History className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Sin historial aún</h1>
        <p className="text-stone-500 mb-8">
          Cuando termines una lista de compras, marcala como cocinada para guardarla aquí.
        </p>
        <Link
          href="/"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
        >
          Ver recetas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a recetas
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <History className="w-6 h-6 text-orange-500" />
          Historial de cocina
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {entries.length} {entries.length === 1 ? "semana cocinada" : "semanas cocinadas"}
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => {
          const entryRecipes = entry.items
            .map((item) => ({ item, recipe: recipes.find((r) => r.id === item.recipeId) }))
            .filter((x): x is { item: typeof entry.items[0]; recipe: NonNullable<typeof x.recipe> } => !!x.recipe);

          const totalCalories = entryRecipes.reduce(
            (sum, { item, recipe }) => sum + recipe.calories * item.servings,
            0
          );

          return (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
            >
              {/* Entry header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone-50">
                <div>
                  <p className="font-semibold text-stone-900 text-sm capitalize">
                    {formatDate(entry.date)}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {entry.items.length} {entry.items.length === 1 ? "receta" : "recetas"} ·{" "}
                    {totalCalories.toLocaleString("es-ES")} kcal totales
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCookAgain(entry.items)}
                    className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-800 border border-orange-200 hover:border-orange-400 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <ChefHat className="w-3 h-3" />
                    Cocinar de nuevo
                  </button>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors p-1"
                    aria-label="Eliminar entrada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recipe list */}
              <div className="divide-y divide-stone-50">
                {entryRecipes.map(({ item, recipe }) => (
                  <div key={item.recipeId} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xl flex-shrink-0">{recipe.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{recipe.name}</p>
                      <p className="text-xs text-stone-400">
                        {item.servings} {item.servings === 1 ? "porción" : "porciones"} · {recipe.calories} kcal/porción
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
