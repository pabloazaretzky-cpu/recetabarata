"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBasket, Trash2, Share2, CheckCircle, Download } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useHistoryStore } from "@/lib/history-store";
import { recipes } from "@/lib/data/recipes";
import type { CartItem } from "@/lib/types";
import ServingsSelector from "@/components/ServingsSelector";
import SupermarketTable from "@/components/SupermarketTable";
import { aggregateIngredients, calcSupermarketPrices, formatAmount } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function encodeCart(items: CartItem[]): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(items))));
}

function decodeCart(encoded: string): CartItem[] | null {
  try {
    const items = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (!Array.isArray(items)) return null;
    return items.filter(
      (item): item is CartItem =>
        typeof item?.recipeId === "string" &&
        typeof item?.servings === "number" &&
        recipes.some((r) => r.id === item.recipeId)
    );
  } catch {
    return null;
  }
}

// ── inner component (needs useSearchParams → wrapped in Suspense) ─────────────

function ShoppingListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, removeRecipe, updateServings, clear, replaceAll } = useCartStore();
  const { addEntry } = useHistoryStore();

  const [realPrices, setRealPrices]     = useState<Record<string, number>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [searchUrls, setSearchUrls]     = useState<Record<string, Record<string, string>>>({});
  const [copied, setCopied]             = useState(false);
  const [cooked, setCooked]             = useState(false);
  const [importBanner, setImportBanner] = useState<CartItem[] | null>(null);

  // Detect shared list in URL
  useEffect(() => {
    const c = searchParams.get("c");
    if (!c) return;
    const decoded = decodeCart(c);
    if (decoded && decoded.length > 0) setImportBanner(decoded);
    // Remove param from URL without re-render
    const url = new URL(window.location.href);
    url.searchParams.delete("c");
    router.replace(url.pathname, { scroll: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          if (entry.mercadona?.price)       mergedPrices[ingId] = entry.mercadona.price;
          if (entry.mercadona?.productName) mergedNames[ingId]  = entry.mercadona.productName;
          if (entry.searchUrls)             mergedUrls[ingId]   = entry.searchUrls;
        }
      }
      setRealPrices(mergedPrices);
      setProductNames(mergedNames);
      setSearchUrls(mergedUrls);
    });
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(() => {
    const encoded = encodeCart(items);
    const url = `${window.location.origin}/shopping-list?c=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [items]);

  const handleCooked = useCallback(() => {
    addEntry(items.map((i) => ({ recipeId: i.recipeId, servings: i.servings })));
    setCooked(true);
    setTimeout(() => setCooked(false), 3000);
  }, [items, addEntry]);

  // ── empty state ─────────────────────────────────────────────────────────────

  if (items.length === 0 && !importBanner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBasket className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Tu lista está vacía</h1>
        <p className="text-stone-500 mb-8">
          Añade recetas desde el catálogo para generar tu lista de compras comparada.
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

      {/* Import banner */}
      {importBanner && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-blue-900 text-sm">Lista compartida recibida</p>
            <p className="text-blue-700 text-xs mt-0.5">
              {importBanner.length} {importBanner.length === 1 ? "receta" : "recetas"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { replaceAll(importBanner); setImportBanner(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Importar
            </button>
            <button
              onClick={() => setImportBanner(null)}
              className="text-blue-500 hover:text-blue-700 text-sm px-3 py-2 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Lista de compras</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {items.length} {items.length === 1 ? "receta" : "recetas"} ·{" "}
            {aggregated.length} ingredientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm border border-stone-200 text-stone-600 hover:border-orange-400 hover:text-orange-600 px-3 py-2 rounded-full transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Compartir"}</span>
          </button>
          {/* Clear */}
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Vaciar</span>
          </button>
        </div>
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
                    <p className="font-medium text-stone-900 text-sm truncate">{recipe.name}</p>
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

      {/* Supermarket comparison */}
      <section className="mb-8">
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

      {/* Mark as cooked */}
      <div className="flex justify-center">
        <button
          onClick={handleCooked}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
            cooked
              ? "bg-emerald-500 text-white"
              : "bg-white border-2 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600"
          }`}
        >
          {cooked ? (
            <>
              <CheckCircle className="w-4 h-4" />
              ¡Guardado en el historial!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Marcar como cocinado
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── page export ───────────────────────────────────────────────────────────────

export default function ShoppingListPage() {
  return (
    <Suspense>
      <ShoppingListContent />
    </Suspense>
  );
}
