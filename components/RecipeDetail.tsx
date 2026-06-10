"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  ChefHat,
  ShoppingCart,
  CheckCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { Recipe, Review } from "@/lib/types";
import { getCategoryById } from "@/lib/data/categories";
import { useCartStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import ServingsSelector from "@/components/ServingsSelector";
import { calcIngredientCost, calcSupermarketPrices, formatAmount, formatPrice, getSmIngredientBreakdown } from "@/lib/utils";
import type { SupermarketId } from "@/lib/types";
import SupermarketTable from "@/components/SupermarketTable";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

interface Props {
  recipe: Recipe;
}

const difficultyColor = {
  fácil: "bg-green-100 text-green-700",
  media: "bg-yellow-100 text-yellow-700",
  difícil: "bg-red-100 text-red-700",
};

export default function RecipeDetail({ recipe }: Props) {
  const { defaultServings } = useSettingsStore();
  const [servings, setServings] = useState(() => defaultServings);
  const { addRecipe, removeRecipe, isInCart } = useCartStore();
  const inCart = isInCart(recipe.id);
  const category = getCategoryById(recipe.category);
  const multiplier = servings / recipe.baseServings;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [realPrices, setRealPrices] = useState<Record<string, number>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [searchUrls, setSearchUrls] = useState<Record<string, Record<string, string>>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [expandedSm, setExpandedSm] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?recipe_id=${recipe.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } finally {
      setLoadingReviews(false);
    }
  }, [recipe.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    fetch(`/api/prices?recipe_id=${recipe.id}`)
      .then((r) => r.json())
      .then((data: Record<string, {
        mercadona: { price: number; productName: string } | null;
        awin: Record<string, { price: number; productName: string } | null>;
        searchUrls: Record<string, string>;
      } | null>) => {
        const priceMap: Record<string, number> = {};
        const nameMap: Record<string, string> = {};
        const urlMap: Record<string, Record<string, string>> = {};
        for (const [id, entry] of Object.entries(data)) {
          if (!entry) continue;
          if (entry.mercadona?.price) priceMap[id] = entry.mercadona.price;
          if (entry.mercadona?.productName) nameMap[id] = entry.mercadona.productName;
          if (entry.searchUrls) urlMap[id] = entry.searchUrls;
        }
        setRealPrices(priceMap);
        setProductNames(nameMap);
        setSearchUrls(urlMap);
      })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, [recipe.id]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const scaledIngredients = recipe.ingredients.map((ing) => ({
    ...ing,
    scaledAmount: ing.amount * multiplier,
  }));

  const totalCost = scaledIngredients.reduce((sum, ing) => {
    const price = realPrices[ing.id] ?? ing.basePrice;
    return sum + calcIngredientCost({ ...ing, basePrice: price }, ing.scaledAmount);
  }, 0);

  const supermarketResults = calcSupermarketPrices(scaledIngredients, realPrices)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  function handleCartToggle() {
    if (inCart) {
      removeRecipe(recipe.id);
    } else {
      addRecipe(recipe.id, servings);
    }
  }

  // Keep cart in sync when servings change while recipe is already in cart
  function handleServingsChange(v: number) {
    setServings(v);
    if (inCart) addRecipe(recipe.id, v);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a recetas
      </Link>

      {/* Hero */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8">
        <Image
          src={recipe.image}
          alt={recipe.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm ${category.textColor}`}
          >
            {category.emoji} {category.name}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColor[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            {recipe.emoji} {recipe.name}
          </h1>
          <p className="text-stone-500 leading-relaxed mb-6">
            {recipe.description}
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              {
                icon: Clock,
                value: `${recipe.prepTime + recipe.cookTime} min`,
                label: "Tiempo",
              },
              {
                icon: Users,
                value: `${recipe.baseServings} pers.`,
                label: "Base",
              },
              {
                icon: Flame,
                value: `${recipe.calories}`,
                label: "kcal",
              },
              {
                icon: ChefHat,
                value: recipe.difficulty,
                label: "Nivel",
              },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="text-center bg-white rounded-xl p-3 border border-stone-100 shadow-sm"
              >
                <Icon className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <p className="text-sm font-semibold text-stone-900 capitalize leading-tight">
                  {value}
                </p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            Preparación
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-stone-600 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-8">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Reviews */}
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-stone-900">Opiniones</h2>
              {!loadingReviews && reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} size="sm" readonly />
                  <span className="text-sm text-stone-500">
                    {avgRating.toFixed(1)} ({reviews.length}{" "}
                    {reviews.length === 1 ? "opinión" : "opiniones"})
                  </span>
                </div>
              )}
            </div>
            <ReviewList reviews={reviews} />
            <div className="mt-6">
              <ReviewForm
                recipeId={recipe.id}
                onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <div className="sticky top-24 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            {/* Servings */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                ¿Para cuántas personas?
              </p>
              <div className="flex items-center justify-between">
                <ServingsSelector
                  value={servings}
                  onChange={handleServingsChange}
                />
                <span className="text-sm text-stone-400">
                  {servings === 1 ? "persona" : "personas"}
                </span>
              </div>
              {servings !== recipe.baseServings && (
                <p className="text-xs text-orange-500 mt-2">
                  Ajustado desde {recipe.baseServings} pers. base
                </p>
              )}
            </div>

            <hr className="border-stone-100 mb-5" />

            {/* Ingredients */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Ingredientes
              </p>
              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing) => {
                  const scaled = ing.amount * multiplier;
                  return (
                    <li
                      key={ing.id}
                      className="flex justify-between text-sm gap-2"
                    >
                      <span className="text-stone-700 truncate">{ing.name}</span>
                      <span className="text-stone-500 font-medium whitespace-nowrap">
                        {formatAmount(scaled, ing.unit)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                <span className="text-sm text-stone-500 flex items-center gap-1">
                  {pricesLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                  ) : Object.keys(realPrices).length > 0 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">M</span>
                  ) : null}
                  Coste estimado
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {formatPrice(totalCost)}
                </span>
              </div>
            </div>

            <hr className="border-stone-100 mb-5" />

            {/* Supermarket comparison */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Precio por supermercado
                </p>
                {!pricesLoading && Object.keys(realPrices).length > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    precios reales ✓
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {supermarketResults.map((sm, index) => {
                  const cheapest = supermarketResults[0];
                  const isBest = index === 0;
                  const pct =
                    index > 0
                      ? Math.round(((sm.totalPrice - cheapest.totalPrice) / cheapest.totalPrice) * 100)
                      : null;
                  const isExpanded = expandedSm === sm.id;
                  const breakdown = isExpanded
                    ? getSmIngredientBreakdown(scaledIngredients, sm.id as SupermarketId, realPrices)
                    : [];

                  return (
                    <div key={sm.id}>
                      <button
                        onClick={() => setExpandedSm(isExpanded ? null : sm.id)}
                        className="w-full flex items-center gap-2 py-1 hover:opacity-80 transition-opacity"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: sm.color }}
                        >
                          {sm.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-medium truncate ${isBest ? "text-green-700" : "text-stone-600"}`}>
                              {sm.name}
                              {isBest && <span className="ml-1 text-green-600">✓</span>}
                            </span>
                            <span className={`text-xs font-bold flex-shrink-0 ${isBest ? "text-green-700" : "text-stone-700"}`}>
                              {formatPrice(sm.totalPrice)}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-1 mt-0.5">
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${(cheapest.totalPrice / sm.totalPrice) * 100}%`,
                                backgroundColor: sm.color,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {pct !== null && (
                            <span className="text-xs text-stone-400">+{pct}%</span>
                          )}
                          <ChevronDown
                            className={`w-3 h-3 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="ml-8 mt-1 mb-2 space-y-1.5 border-l-2 border-stone-100 pl-3">
                          {breakdown.map((item) => (
                            <div key={item.id} className="flex justify-between items-start gap-2">
                              <span className="text-xs text-stone-500 leading-tight">
                                {sm.id === "mercadona" && productNames[item.id]
                                  ? productNames[item.id]
                                  : item.name}
                                {sm.id !== "mercadona" && (
                                  <span className="text-stone-400"> · est.</span>
                                )}
                              </span>
                              <span className="text-xs text-stone-600 font-medium flex-shrink-0">
                                {formatPrice(item.cost)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Ahorra {formatPrice(supermarketResults[supermarketResults.length - 1].totalPrice - supermarketResults[0].totalPrice)} eligiendo {supermarketResults[0].name}
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleCartToggle}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                inCart
                  ? "bg-green-50 text-green-700 border-2 border-green-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-orange-200"
              }`}
            >
              {inCart ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  En tu lista · Toca para quitar
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Añadir a la lista
                </>
              )}
            </button>

            {inCart && (
              <Link
                href="/shopping-list"
                className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 text-orange-600 hover:text-orange-700 transition-colors"
              >
                Ver lista de compras →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full-width price comparison table */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-stone-900 mb-4">
          Comparativa de precios por supermercado
        </h2>
        <SupermarketTable
          results={supermarketResults}
          ingredients={scaledIngredients}
          priceOverrides={realPrices}
          productNames={productNames}
          searchUrls={searchUrls}
        />
      </section>
    </div>
  );
}
