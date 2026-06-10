"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ShoppingBasket, ArrowLeft, CalendarDays, Shuffle } from "lucide-react";
import { usePlannerStore } from "@/lib/planner-store";
import { useCartStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import { GOAL_CONFIG, filterByGoal, filterByMealType, filterByDifficulty } from "@/lib/goals";
import { estimateProteinPerServing } from "@/lib/nutrition";
import { estimateRecipeCost, formatPrice } from "@/lib/utils";
import RecipePicker from "@/components/RecipePicker";
import { recipes as allRecipes } from "@/lib/data/recipes";
import type { MealType, WeekDay, NutritionalGoal, Difficulty, Recipe } from "@/lib/types";

const DAYS: { id: WeekDay; short: string }[] = [
  { id: "lunes",     short: "Lun" },
  { id: "martes",    short: "Mar" },
  { id: "miercoles", short: "Mié" },
  { id: "jueves",    short: "Jue" },
  { id: "viernes",   short: "Vie" },
  { id: "sabado",    short: "Sáb" },
  { id: "domingo",   short: "Dom" },
];

const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
  { id: "desayuno", label: "Desayuno", emoji: "☀️" },
  { id: "almuerzo", label: "Almuerzo", emoji: "🍽️" },
  { id: "snack",    label: "Snack",    emoji: "🍎" },
  { id: "cena",     label: "Cena",     emoji: "🌙" },
];

export default function PlannerPage() {
  const router = useRouter();
  const { goal, difficulty, slots, budget, setGoal, setDifficulty, setSlot, clearSlot, clearAll, setBudget } = usePlannerStore();
  const { replaceAll } = useCartStore();
  const { defaultServings } = useSettingsStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: WeekDay; meal: MealType } | null>(null);

  function openPicker(day: WeekDay, meal: MealType) {
    setActiveCell({ day, meal });
    setPickerOpen(true);
  }

  function handleSelect(recipe: Recipe) {
    if (!activeCell) return;
    setSlot(activeCell.day, activeCell.meal, recipe.id, defaultServings);
    setPickerOpen(false);
    setActiveCell(null);
  }

  function handleRandomPlan() {
    for (const day of DAYS) {
      for (const meal of MEAL_TYPES) {
        const pool = filterByDifficulty(
          filterByMealType(filterByGoal(allRecipes, goal), meal.id),
          difficulty
        );
        if (pool.length === 0) continue;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setSlot(day.id, meal.id, picked.id, defaultServings);
      }
    }
  }

  function handleGenerateList() {
    if (slots.length === 0) return;
    const merged = new Map<string, number>();
    for (const slot of slots) {
      merged.set(slot.recipeId, (merged.get(slot.recipeId) ?? 0) + slot.servings);
    }
    replaceAll(
      Array.from(merged.entries()).map(([recipeId, servings]) => ({ recipeId, servings }))
    );
    router.push("/shopping-list");
  }

  const totalSlots = slots.length;

  const totalEstimatedCost = slots.reduce((sum, s) => {
    const r = allRecipes.find((x) => x.id === s.recipeId);
    return r ? sum + estimateRecipeCost(r, s.servings) : sum;
  }, 0);

  const budgetPct = budget && budget > 0 ? Math.min((totalEstimatedCost / budget) * 100, 100) : 0;
  const overBudget = budget != null && totalEstimatedCost > budget;

  // Calories and protein are per person (don't multiply by servings)
  const plannedDays = new Set(slots.map((s) => s.day)).size;

  const { totalCalories, totalProtein } = slots.reduce(
    (acc, s) => {
      const r = allRecipes.find((x) => x.id === s.recipeId);
      if (!r) return acc;
      return {
        totalCalories: acc.totalCalories + r.calories,
        totalProtein:  acc.totalProtein  + estimateProteinPerServing(r),
      };
    },
    { totalCalories: 0, totalProtein: 0 }
  );

  const avgCalPerDay     = plannedDays > 0 ? Math.round(totalCalories / plannedDays) : 0;
  const avgProteinPerDay = plannedDays > 0 ? Math.round(totalProtein  / plannedDays) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a recetas
      </Link>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-orange-500" />
            Planificador semanal
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Organizá tus comidas y generá la lista de compras automáticamente
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleRandomPlan}
            className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Plan aleatorio</span>
          </button>
          {slots.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Budget */}
      <section className="mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Presupuesto semanal
        </p>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">€</span>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="0"
                value={budget ?? ""}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : null)}
                className="pl-7 pr-3 py-2 w-32 rounded-xl border border-stone-200 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            {budget != null && totalSlots > 0 && (
              <p className={`text-sm font-medium ${overBudget ? "text-red-500" : "text-stone-600"}`}>
                ~{formatPrice(totalEstimatedCost)} estimado
                {overBudget && " · ¡Sobre el presupuesto!"}
              </p>
            )}
          </div>
          {budget != null && budget > 0 && totalSlots > 0 && (
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overBudget ? "bg-red-400" : budgetPct > 80 ? "bg-yellow-400" : "bg-emerald-400"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Goal selector */}
      <section className="mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Objetivo nutricional
        </p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(GOAL_CONFIG) as NutritionalGoal[]).map((g) => {
            const cfg = GOAL_CONFIG[g];
            const active = goal === g;
            return (
              <button
                key={g}
                onClick={() => setGoal(g)}
                title={cfg.description}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty filter */}
      <section className="mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Dificultad
        </p>
        <div className="flex gap-2 flex-wrap">
          {([null, "fácil", "media", "difícil"] as (Difficulty | null)[]).map((d) => (
            <button
              key={d ?? "todas"}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                difficulty === d
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              {d === null && "Todas"}
              {d === "fácil"   && "🟢 Fácil"}
              {d === "media"   && "🟡 Media"}
              {d === "difícil" && "🔴 Difícil"}
            </button>
          ))}
        </div>
      </section>

      {/* Week grid */}
      <section className="mb-6">
        <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-sm">
          <div className="min-w-[560px]">
            {/* Day headers */}
            <div className="grid grid-cols-[72px_repeat(7,1fr)] bg-stone-50 border-b border-stone-200">
              <div className="p-3" />
              {DAYS.map((day) => (
                <div
                  key={day.id}
                  className="p-3 text-center border-l border-stone-200"
                >
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    {day.short}
                  </p>
                </div>
              ))}
            </div>

            {/* Meal rows */}
            {MEAL_TYPES.map((meal, mealIdx) => (
              <div
                key={meal.id}
                className={`grid grid-cols-[72px_repeat(7,1fr)] ${
                  mealIdx < MEAL_TYPES.length - 1 ? "border-b border-stone-200" : ""
                }`}
              >
                {/* Meal label */}
                <div className="flex flex-col items-center justify-center gap-0.5 bg-stone-50 border-r border-stone-200 py-3 px-1">
                  <span className="text-base">{meal.emoji}</span>
                  <span className="text-xs font-medium text-stone-500 text-center leading-tight">
                    {meal.label}
                  </span>
                </div>

                {/* Day cells */}
                {DAYS.map((day, dayIdx) => {
                  const slot = slots.find(
                    (s) => s.day === day.id && s.meal === meal.id
                  );
                  const recipe = slot
                    ? allRecipes.find((r) => r.id === slot.recipeId)
                    : null;

                  return (
                    <div
                      key={day.id}
                      className={`p-1.5 ${dayIdx < DAYS.length - 1 ? "border-r border-stone-100" : ""}`}
                    >
                      {recipe ? (
                        <div className="relative bg-orange-50 rounded-xl p-2 h-full min-h-[76px] flex flex-col gap-1">
                          <button
                            onClick={() => clearSlot(day.id, meal.id)}
                            className="absolute top-1.5 right-1.5 text-stone-300 hover:text-red-400 transition-colors"
                            aria-label="Quitar receta"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span className="text-xl leading-none">{recipe.emoji}</span>
                          <p className="text-xs font-medium text-stone-800 leading-tight pr-4 line-clamp-2">
                            {recipe.name}
                          </p>
                          <p className="text-xs text-stone-400 mt-auto">
                            {recipe.calories} kcal
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => openPicker(day.id, meal.id)}
                          className="w-full h-full min-h-[76px] flex items-center justify-center rounded-xl border-2 border-dashed border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                          aria-label={`Añadir ${meal.label} del ${day.short}`}
                        >
                          <Plus className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-5 flex-wrap">
          <div>
            <p className="text-xl font-bold text-stone-900">{totalSlots}</p>
            <p className="text-xs text-stone-500">
              {totalSlots === 1 ? "comida" : "comidas"}
            </p>
          </div>
          {totalSlots > 0 && (
            <>
              <div className="w-px h-8 bg-stone-200" />
              <div>
                <p className="text-xl font-bold text-orange-500">
                  {avgCalPerDay.toLocaleString("es-ES")}
                </p>
                <p className="text-xs text-stone-500">
                  kcal/día · por persona
                  <span className="text-stone-400">
                    {" "}({totalCalories.toLocaleString("es-ES")} semana)
                  </span>
                </p>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div>
                <p className="text-xl font-bold text-emerald-600">
                  ~{avgProteinPerDay} g
                </p>
                <p className="text-xs text-stone-500">
                  proteína/día · por persona
                  <span className="text-stone-400">
                    {" "}(~{Math.round(totalProtein)} g semana)
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleGenerateList}
          disabled={slots.length === 0}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
        >
          <ShoppingBasket className="w-4 h-4" />
          Ver lista de compras
        </button>
      </div>

      {/* Recipe picker modal */}
      {pickerOpen && activeCell && (
        <RecipePicker
          goal={goal}
          mealType={activeCell.meal}
          difficulty={difficulty}
          onSelect={handleSelect}
          onClose={() => {
            setPickerOpen(false);
            setActiveCell(null);
          }}
        />
      )}
    </div>
  );
}
