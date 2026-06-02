"use client";

import { useState } from "react";
import { MapPin, Trophy, ChevronDown } from "lucide-react";
import type { AggregatedIngredient, SupermarketId, SupermarketResult } from "@/lib/types";
import { formatPrice, getSmIngredientBreakdown } from "@/lib/utils";

interface Props {
  results: SupermarketResult[];
  ingredients?: AggregatedIngredient[];
  priceOverrides?: Record<string, number>;
  productNames?: Record<string, string>;
}

export default function SupermarketComparison({
  results,
  ingredients = [],
  priceOverrides = {},
  productNames = {},
}: Props) {
  const sorted = [...results].sort((a, b) => a.totalPrice - b.totalPrice);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const saving = mostExpensive.totalPrice - cheapest.totalPrice;
  const [expandedSm, setExpandedSm] = useState<string | null>(null);

  return (
    <div>
      {/* Saving highlight */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800">
            Mejor precio: {cheapest.name} — {formatPrice(cheapest.totalPrice)}
          </p>
          <p className="text-sm text-green-600">
            Ahorra {formatPrice(saving)} vs {mostExpensive.name}
          </p>
        </div>
      </div>

      {/* Supermarket cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((sm, index) => {
          const isBest = index === 0;
          const pctMore =
            index > 0
              ? (((sm.totalPrice - cheapest.totalPrice) / cheapest.totalPrice) * 100).toFixed(0)
              : null;
          const isExpanded = expandedSm === sm.id;
          const breakdown =
            isExpanded && ingredients.length > 0
              ? getSmIngredientBreakdown(ingredients, sm.id as SupermarketId, priceOverrides)
              : [];

          return (
            <div
              key={sm.id}
              className={`rounded-xl border-2 transition-all ${
                isBest ? "border-green-400 bg-green-50" : "border-stone-100 bg-white"
              }`}
            >
              <button
                onClick={() => setExpandedSm(isExpanded ? null : sm.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: sm.color }}
                    >
                      {sm.logo}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">
                        {sm.name}
                        {isBest && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            ✓ Mejor precio
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {sm.distance} · {sm.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-stone-900">
                        {formatPrice(sm.totalPrice)}
                      </p>
                      {pctMore && (
                        <p className="text-xs text-stone-400">+{pctMore}% más caro</p>
                      )}
                    </div>
                    {ingredients.length > 0 && (
                      <ChevronDown
                        className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </div>

                {/* Price bar */}
                <div className="w-full bg-stone-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${(cheapest.totalPrice / sm.totalPrice) * 100}%`,
                      backgroundColor: sm.color,
                    }}
                  />
                </div>
              </button>

              {isExpanded && breakdown.length > 0 && (
                <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-2">
                  {breakdown.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-3">
                      <span className="text-xs text-stone-500 leading-tight">
                        {sm.id === "mercadona" && productNames[item.id]
                          ? productNames[item.id]
                          : item.name}
                        {sm.id !== "mercadona" && (
                          <span className="text-stone-400"> · estimado</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 flex-shrink-0">
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
    </div>
  );
}
