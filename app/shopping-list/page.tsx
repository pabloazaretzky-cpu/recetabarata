"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBasket, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { recipes } from "@/lib/data/recipes";
import ServingsSelector from "@/components/ServingsSelector";
import SupermarketTable from "@/components/SupermarketTable";
import { aggregateIngredients, calcSupermarketPrices, formatAmount } from "@/lib/utils";

export default function ShoppingListPage() {
  const { items, removeRecipe, updateServings, clear } = useCartStore();
  const [realPrices, setRealPrices] = useState<Record<string, number>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [searchUrls, setSearchUrls] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (items.length === 0) return;
    const recipeIds = items.map((i) => i.recipeId);
    Promise.all(
      recipeIds.map((id) =>
        fetch(`/api/prices?recipe_id=${id}`)
          .then((r) => r.json())
          .then((data: Record<string, {
            mercadona: { price: number; productName: string } | null;
            awin: Record<string, { price: number; productName: string } | null>;
            searchUrls: Record<string, string>;
          } | null>) => data)
          .catch(() => ({} as Record<string, null>))
      )
    ).then((results) => {
      const mergedPrices: Record<string, number> = {};
      const mergedNames: Record<string, string> = {};
      const mergedUrls: Record<string, Record<string, string>> = {};
      for (const data of results) {
        for (const [ingId, entry] of Object.entries(data)) {
          if (!entry) continue;
          if (entry.mercadona?.price) mergedPrices[ingId] = entry.mercadona.price;
          if (entry.mercadona?.productName) mergedNames[ingId] = entry.mercadona.productName;
          if (entry.searchUrls) mergedUrls[ingId] = entry.searchUrls;
        }
      }
      setRealPrices(mergedPrices);
      setProductNames(mergedNames);
      setSearchUrls(mergedUrls);
    });
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBasket className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Tu lista está vacía
        </h1>
        <p className="text-stone-500 mb-8">
          Añade recetas desde el catálogo para generar tu lista de compras
          comparada.
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

  const aggregated = aggregateIngredients(items);
  const supermarketResults = calcSupermarketPrices(aggregated, realPrices);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a recetas
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Lista de compras
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {items.length} {items.length === 1 ? "receta" : "recetas"} ·{" "}
            {aggregated.length} ingredientes
          </p>
        </div>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Vaciar lista
        </button>
      </div>

      {/* Recipes in cart */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Mis recetas
        </h2>
        <div className="space-y-2">
          {items.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId);
            if (!recipe) return null;
            return (
              <div
                key={item.recipeId}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-stone-100 shadow-sm gap-4"
              >
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl flex-shrink-0">{recipe.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900 text-sm truncate">
                      {recipe.name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {recipe.prepTime + recipe.cookTime} min · {recipe.difficulty}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <ServingsSelector
                    value={item.servings}
                    onChange={(v) => updateServings(item.recipeId, v)}
                  />
                  <button
                    onClick={() => removeRecipe(item.recipeId)}
                    className="text-stone-300 hover:text-red-500 transition-colors"
                    aria-label="Eliminar receta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ingredient amounts */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Ingredientes necesarios
        </h2>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {aggregated.map((ing, i) => (
            <div
              key={ing.id}
              className={`flex justify-between items-center px-4 py-3 ${
                i < aggregated.length - 1 ? "border-b border-stone-50" : ""
              }`}
            >
              <span className="text-stone-700 text-sm">{ing.name}</span>
              <span className="text-stone-500 text-sm font-medium">
                {formatAmount(ing.scaledAmount, ing.unit)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Supermarket comparison table */}
      <section>
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Comparativa de precios
        </h2>
        <SupermarketTable
          results={supermarketResults}
          ingredients={aggregated}
          priceOverrides={realPrices}
          productNames={productNames}
          searchUrls={searchUrls}
        />
      </section>
    </div>
  );
}
