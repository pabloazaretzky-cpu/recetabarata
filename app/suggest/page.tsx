"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, ArrowRight, ArrowLeft, Clock, Flame, ChefHat, ShoppingCart } from "lucide-react";
import { recipes } from "@/lib/data/recipes";
import { getCategoryById } from "@/lib/data/categories";
import { useCartStore } from "@/lib/store";
import type { Recipe } from "@/lib/types";

type TimeOption = "rapido" | "medio" | "largo" | "cualquiera";
type DifficultyOption = "fácil" | "media" | "difícil" | "cualquiera";
type DietOption = "cualquiera" | "vegana";

interface Filters {
  time: TimeOption;
  difficulty: DifficultyOption;
  diet: DietOption;
}

function matchScore(recipe: Recipe, ingredients: string[]): number {
  if (ingredients.length === 0) return 0;
  const recipeNames = recipe.ingredients.map((i) => i.name.toLowerCase());
  let matches = 0;
  for (const ing of ingredients) {
    const q = ing.toLowerCase().trim();
    if (recipeNames.some((n) => n.includes(q) || q.includes(n.split(" ")[0]))) {
      matches++;
    }
  }
  return matches;
}

function filterRecipes(ingredients: string[], filters: Filters) {
  return recipes
    .map((r) => ({ recipe: r, score: matchScore(r, ingredients) }))
    .filter(({ recipe, score }) => {
      if (score === 0) return false;
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (filters.time === "rapido" && totalTime > 20) return false;
      if (filters.time === "medio" && (totalTime <= 20 || totalTime > 45)) return false;
      if (filters.time === "largo" && totalTime <= 45) return false;
      if (filters.difficulty !== "cualquiera" && recipe.difficulty !== filters.difficulty) return false;
      if (filters.diet === "vegana" && recipe.category !== "vegana") return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

const timeOptions: { value: TimeOption; label: string; desc: string }[] = [
  { value: "rapido", label: "Menos de 20 min", desc: "Rápido y fácil" },
  { value: "medio", label: "20 – 45 min", desc: "Tiempo normal" },
  { value: "largo", label: "Más de 45 min", desc: "Me tomo mi tiempo" },
  { value: "cualquiera", label: "Sin límite", desc: "Lo que sea" },
];

const diffOptions: { value: DifficultyOption; label: string }[] = [
  { value: "fácil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "difícil", label: "Difícil" },
  { value: "cualquiera", label: "Cualquier nivel" },
];

const dietOptions: { value: DietOption; label: string; emoji: string }[] = [
  { value: "cualquiera", label: "Sin restricciones", emoji: "🍽️" },
  { value: "vegana", label: "Vegana / vegetariana", emoji: "🌱" },
];

export default function SuggestPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputValue, setInputValue] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    time: "cualquiera",
    difficulty: "cualquiera",
    diet: "cualquiera",
  });
  const { addRecipe, isInCart } = useCartStore();

  function addIngredient() {
    const val = inputValue.trim();
    if (!val) return;
    const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
    setIngredients((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) next.push(p);
      }
      return next;
    });
    setInputValue("");
  }

  function removeIngredient(ing: string) {
    setIngredients((prev) => prev.filter((i) => i !== ing));
  }

  const results = step === 3 ? filterRecipes(ingredients, filters) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-4xl mb-2">🤔</p>
        <h1 className="text-3xl font-bold text-stone-900">¿Qué cocino hoy?</h1>
        <p className="text-stone-500 mt-1">
          Decime qué tenés en casa y te sugiero recetas
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-10 h-0.5 ${step > s ? "bg-orange-400" : "bg-stone-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Ingredients */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-1">
            ¿Qué ingredientes tenés?
          </h2>
          <p className="text-stone-400 text-sm mb-4">
            Escribí uno por uno o varios separados por coma
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIngredient()}
              placeholder="ej. huevo, tomate, arroz..."
              className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
            />
            <button
              onClick={addIngredient}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Chips */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {ingredients.map((ing) => (
                <span
                  key={ing}
                  className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1.5 rounded-full text-sm"
                >
                  {ing}
                  <button onClick={() => removeIngredient(ing)}>
                    <X className="w-3.5 h-3.5 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {ingredients.length === 0 && (
            <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-400 text-sm mb-6">
              Todavía no agregaste ningún ingrediente
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={ingredients.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Preferences */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-5">
            ¿Cuáles son tus preferencias?
          </h2>

          {/* Time */}
          <div className="mb-5">
            <p className="text-sm font-medium text-stone-600 mb-2">Tiempo disponible</p>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilters((f) => ({ ...f, time: opt.value }))}
                  className={`px-4 py-3 rounded-xl border text-left transition-colors ${
                    filters.time === opt.value
                      ? "border-orange-400 bg-orange-50 text-orange-800"
                      : "border-stone-200 hover:border-stone-300 text-stone-700"
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-stone-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <p className="text-sm font-medium text-stone-600 mb-2">Dificultad</p>
            <div className="flex gap-2 flex-wrap">
              {diffOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilters((f) => ({ ...f, difficulty: opt.value }))}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    filters.difficulty === opt.value
                      ? "border-orange-400 bg-orange-50 text-orange-800"
                      : "border-stone-200 hover:border-stone-300 text-stone-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className="mb-8">
            <p className="text-sm font-medium text-stone-600 mb-2">Dieta</p>
            <div className="flex gap-2">
              {dietOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilters((f) => ({ ...f, diet: opt.value }))}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    filters.diet === opt.value
                      ? "border-orange-400 bg-orange-50 text-orange-800"
                      : "border-stone-200 hover:border-stone-300 text-stone-600"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-200 text-stone-600 hover:border-stone-300 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Ver sugerencias
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-stone-800">
              {results.length > 0
                ? `${results.length} receta${results.length > 1 ? "s" : ""} para vos`
                : "Sin resultados"}
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-stone-600 font-medium mb-1">No encontramos recetas</p>
              <p className="text-stone-400 text-sm">
                Probá con otros ingredientes o cambiá los filtros
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(({ recipe, score }) => {
                const category = getCategoryById(recipe.category);
                const inCart = isInCart(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex gap-0"
                  >
                    {/* Image */}
                    <div className="relative w-28 sm:w-36 flex-shrink-0">
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900 text-sm leading-tight">
                          {recipe.emoji} {recipe.name}
                        </h3>
                        <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {score}/{ingredients.length} ingredientes
                        </span>
                      </div>

                      <p className="text-xs text-stone-400 mb-2 line-clamp-2">
                        {recipe.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.prepTime + recipe.cookTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {recipe.calories} kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          {recipe.difficulty}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${category.textColor} bg-white border border-current border-opacity-30`}>
                          {category.emoji} {category.name}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          Ver receta →
                        </Link>
                        <button
                          onClick={() => addRecipe(recipe.id, recipe.baseServings)}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            inCart
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          }`}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {inCart ? "En lista" : "Agregar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href="/shopping-list"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Ver lista de compras
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
