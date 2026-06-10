"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Flame } from "lucide-react";
import { recipes as allRecipes } from "@/lib/data/recipes";
import { filterByGoal, filterByMealType, filterByDifficulty } from "@/lib/goals";
import type { NutritionalGoal, MealType, Difficulty, Recipe } from "@/lib/types";

interface Props {
  goal: NutritionalGoal;
  mealType: MealType;
  difficulty: Difficulty | null;
  onSelect: (recipe: Recipe) => void;
  onClose: () => void;
}

const MEAL_LABEL: Record<MealType, string> = {
  desayuno: "desayunos",
  almuerzo: "almuerzos",
  cena:     "cenas",
  snack:    "snacks",
};

export default function RecipePicker({ goal, mealType, difficulty, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = filterByDifficulty(filterByMealType(filterByGoal(allRecipes, goal), mealType), difficulty);
  const displayed = search.trim()
    ? filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : filtered;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-900">Elegir receta</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar receta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-stone-900 placeholder-stone-400"
            />
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {displayed.length} {MEAL_LABEL[mealType]}
            {goal !== "libre" ? ` · objetivo: ${goal}` : ""}
          </p>
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto flex-1 p-2">
          {displayed.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm font-medium">No hay recetas con ese criterio</p>
              <p className="text-xs mt-1">Prueba con otro objetivo o búsqueda</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayed.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-left group"
                >
                  <span className="text-2xl flex-shrink-0">{recipe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate group-hover:text-orange-700">
                      {recipe.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Flame className="w-3 h-3" />
                        {recipe.calories} kcal
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
