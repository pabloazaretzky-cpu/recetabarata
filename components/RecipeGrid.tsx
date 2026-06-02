"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";
import { categories } from "@/lib/data/categories";
import type { Recipe, CategoryId, RatingStats, Difficulty } from "@/lib/types";

type TimeFilter = "rapido" | "medio" | "largo";
type NutritionFilter = "bajo-calorias" | "alto-proteinas";
type AllergyFilter = "sin-gluten" | "sin-lacteos" | "sin-huevo" | "sin-frutos-secos";
type SortBy = "mejor-valoradas" | "mas-resenas";

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "rapido", label: "⚡ -20 min" },
  { value: "medio",  label: "🕐 20-45 min" },
  { value: "largo",  label: "🍳 +45 min" },
];

const diffOptions: { value: Difficulty; label: string }[] = [
  { value: "fácil",   label: "🟢 Fácil" },
  { value: "media",   label: "🟡 Media" },
  { value: "difícil", label: "🔴 Difícil" },
];

const nutritionOptions: { value: NutritionFilter; label: string }[] = [
  { value: "bajo-calorias",   label: "🥗 Bajo en calorías" },
  { value: "alto-proteinas",  label: "💪 Alto en proteínas" },
];

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "mejor-valoradas", label: "⭐ Mejor valoradas" },
  { value: "mas-resenas",     label: "💬 Más reseñas" },
];

const allergyOptions: { value: AllergyFilter; label: string }[] = [
  { value: "sin-gluten",        label: "🌾 Sin gluten" },
  { value: "sin-lacteos",       label: "🥛 Sin lácteos" },
  { value: "sin-huevo",         label: "🥚 Sin huevo" },
  { value: "sin-frutos-secos",  label: "🥜 Sin frutos secos" },
];

const allergyKeywords: Record<AllergyFilter, string[]> = {
  "sin-gluten":       ["harina", "pan ", "pasta", "noodle", "fideo", "lámina", "gnocchi", "tortilla de trigo", "granola", "avena", "centeno", "cebada"],
  "sin-lacteos":      ["queso", "leche", "mantequilla", "yogur", "nata", "crema de"],
  "sin-huevo":        ["huevo"],
  "sin-frutos-secos": ["nuez", "piñon", "almendra", "cacahuete", "avellana", "anacardo"],
};

function hasAllergen(recipe: Recipe, allergy: AllergyFilter): boolean {
  const keywords = allergyKeywords[allergy];
  return recipe.ingredients.some((ing) =>
    keywords.some((kw) => ing.name.toLowerCase().includes(kw))
  );
}

function isHighProtein(recipe: Recipe): boolean {
  return (
    recipe.ingredients.some((ing) => ing.category === "carnes" || ing.category === "pescados") ||
    recipe.tags.some((t) => t.toLowerCase().includes("proteína"))
  );
}

interface Props {
  recipes: Recipe[];
  ratingsMap?: Record<string, RatingStats>;
}

export default function RecipeGrid({ recipes, ratingsMap = {} }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(null);
  const [diffFilter, setDiffFilter] = useState<Difficulty | null>(null);
  const [nutritionFilter, setNutritionFilter] = useState<NutritionFilter | null>(null);
  const [allergies, setAllergies] = useState<Set<AllergyFilter>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy | null>(null);

  function toggleCategory(id: CategoryId) {
    setActiveCategory((prev) => (prev === id ? "all" : id));
  }

  function toggleAllergy(a: AllergyFilter) {
    setAllergies((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  const hasFilters =
    activeCategory !== "all" || search || timeFilter || diffFilter || nutritionFilter || allergies.size > 0 || sortBy;

  function clearAll() {
    setActiveCategory("all");
    setSearch("");
    setTimeFilter(null);
    setDiffFilter(null);
    setNutritionFilter(null);
    setAllergies(new Set());
    setSortBy(null);
  }

  const filtered = recipes
    .filter((r) => {
      const totalTime = r.prepTime + r.cookTime;
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (search.trim() && !r.name.toLowerCase().includes(search.toLowerCase()) &&
          !r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
      if (timeFilter === "rapido" && totalTime > 20) return false;
      if (timeFilter === "medio" && (totalTime <= 20 || totalTime > 45)) return false;
      if (timeFilter === "largo" && totalTime <= 45) return false;
      if (diffFilter && r.difficulty !== diffFilter) return false;
      if (nutritionFilter === "bajo-calorias" && r.calories >= 400) return false;
      if (nutritionFilter === "alto-proteinas" && !isHighProtein(r)) return false;
      for (const allergy of allergies) {
        if (hasAllergen(r, allergy)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      const ra = ratingsMap[a.id] ?? { avg: 0, count: 0 };
      const rb = ratingsMap[b.id] ?? { avg: 0, count: 0 };
      if (sortBy === "mejor-valoradas") return rb.avg - ra.avg || rb.count - ra.count;
      if (sortBy === "mas-resenas") return rb.count - ra.count || rb.avg - ra.avg;
      return 0;
    });

  return (
    <div>
      {/* Category banners — act as filter buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`bg-gradient-to-br ${cat.gradient} rounded-xl p-3 text-white text-center transition-all duration-200 ${
                isActive
                  ? "ring-4 ring-white ring-offset-2 scale-105 shadow-lg"
                  : "opacity-80 hover:opacity-100 hover:scale-105"
              }`}
            >
              <p className="text-2xl mb-1">{cat.emoji}</p>
              <p className="text-xs font-semibold leading-tight">{cat.name}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Busca una receta o ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-stone-900 placeholder-stone-400"
        />
      </div>

      {/* Secondary filters */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4 mb-5 space-y-3">
        {/* Time */}
        <FilterRow label="Tiempo">
          {timeOptions.map((opt) => (
            <Pill
              key={opt.value}
              active={timeFilter === opt.value}
              onClick={() => setTimeFilter((prev) => (prev === opt.value ? null : opt.value))}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterRow>

        {/* Difficulty */}
        <FilterRow label="Dificultad">
          {diffOptions.map((opt) => (
            <Pill
              key={opt.value}
              active={diffFilter === opt.value}
              onClick={() => setDiffFilter((prev) => (prev === opt.value ? null : opt.value))}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterRow>

        {/* Nutrition */}
        <FilterRow label="Nutrición">
          {nutritionOptions.map((opt) => (
            <Pill
              key={opt.value}
              active={nutritionFilter === opt.value}
              onClick={() => setNutritionFilter((prev) => (prev === opt.value ? null : opt.value))}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterRow>

        {/* Sort by popularity */}
        <FilterRow label="Ordenar">
          {sortOptions.map((opt) => (
            <Pill
              key={opt.value}
              active={sortBy === opt.value}
              onClick={() => setSortBy((prev) => (prev === opt.value ? null : opt.value))}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterRow>

        {/* Allergies — multi-select */}
        <FilterRow label="Sin...">
          {allergyOptions.map((opt) => (
            <Pill
              key={opt.value}
              active={allergies.has(opt.value)}
              onClick={() => toggleAllergy(opt.value)}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterRow>

        {hasFilters && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-stone-500 mb-4">
        {filtered.length} {filtered.length === 1 ? "receta" : "recetas"}
        {hasFilters ? " encontradas" : " en total"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} rating={ratingsMap[recipe.id]} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-stone-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No encontramos recetas</p>
          <p className="text-sm">Prueba con otro término o categoría</p>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-stone-400 w-20 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400"
      }`}
    >
      {children}
    </button>
  );
}
