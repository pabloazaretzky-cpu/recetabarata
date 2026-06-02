"use client";

import type { AggregatedIngredient, SupermarketId, SupermarketResult } from "@/lib/types";
import { formatPrice, getSmIngredientBreakdown } from "@/lib/utils";
import { STORE_HOME_URLS } from "@/lib/awin";
import { Trophy } from "lucide-react";

interface Props {
  results: SupermarketResult[];
  ingredients: AggregatedIngredient[];
  priceOverrides?: Record<string, number>;
  productNames?: Record<string, string>;
  // ingId → smId → URL (search or affiliate link)
  searchUrls?: Record<string, Record<string, string>>;
}

export default function SupermarketTable({
  results,
  ingredients,
  priceOverrides = {},
  productNames = {},
  searchUrls = {},
}: Props) {
  const sorted = [...results].sort((a, b) => a.totalPrice - b.totalPrice);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];

  // Build matrix: smId → ingId → cost
  const breakdownBySm = new Map<string, Map<string, number>>();
  for (const sm of sorted) {
    const rows = getSmIngredientBreakdown(
      ingredients,
      sm.id as SupermarketId,
      priceOverrides
    );
    breakdownBySm.set(sm.id, new Map(rows.map((r) => [r.id, r.cost])));
  }

  return (
    <div>
      {/* Winner banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <Trophy className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800 text-sm">
            Mejor precio: {cheapest.name} — {formatPrice(cheapest.totalPrice)}
          </p>
          <p className="text-xs text-green-600">
            Ahorra {formatPrice(mostExpensive.totalPrice - cheapest.totalPrice)} vs{" "}
            {mostExpensive.name}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-100 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider min-w-[180px]">
                Producto / Ingrediente
              </th>
              {sorted.map((sm) => (
                <th key={sm.id} className="px-3 py-3 text-center min-w-[90px]">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: sm.color }}
                    >
                      {sm.logo}
                    </div>
                    <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">
                      {sm.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ingredients.map((ing, i) => {
              const costs = sorted.map(
                (sm) => breakdownBySm.get(sm.id)?.get(ing.id) ?? 0
              );
              const validCosts = costs.filter((c) => c > 0);
              const minCost = validCosts.length ? Math.min(...validCosts) : 0;
              const brand = productNames[ing.id];

              return (
                <tr
                  key={ing.id}
                  className={`border-b border-stone-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-stone-50/50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-stone-800 leading-snug">
                      {brand ?? ing.name}
                    </p>
                    {brand && (
                      <p className="text-xs text-stone-400 leading-snug mt-0.5">
                        {ing.name}
                      </p>
                    )}
                  </td>
                  {sorted.map((sm, j) => {
                    const cost = costs[j];
                    const isCheapest = cost > 0 && cost === minCost;
                    const href = searchUrls[ing.id]?.[sm.id];
                    const inner = cost > 0 ? (
                      <>
                        <span className={`text-xs font-semibold block ${isCheapest ? "text-green-700" : "text-stone-600"}`}>
                          {formatPrice(cost)}{isCheapest && " ✓"}
                        </span>
                        {sm.id !== "mercadona" && (
                          <span className="text-xs text-stone-300 block leading-none">est.</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    );

                    return (
                      <td key={sm.id} className="px-3 py-3 text-center">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block hover:opacity-70 transition-opacity"
                            title={`Buscar en ${sm.name}`}
                          >
                            {inner}
                          </a>
                        ) : inner}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-stone-100 border-t-2 border-stone-200">
              <td className="px-4 py-3 text-xs font-bold text-stone-700 uppercase tracking-wider">
                Total
              </td>
              {sorted.map((sm, index) => {
                const isBest = index === 0;
                return (
                  <td key={sm.id} className="px-3 py-3 text-center">
                    <span className={`text-sm font-bold block ${isBest ? "text-green-700" : "text-stone-700"}`}>
                      {formatPrice(sm.totalPrice)}
                    </span>
                    {isBest && (
                      <span className="text-xs text-green-600 font-medium block leading-none">
                        mejor ✓
                      </span>
                    )}
                    <a
                      href={STORE_HOME_URLS[sm.id as SupermarketId]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-stone-400 hover:text-stone-600 underline mt-1 block transition-colors"
                    >
                      Ir a tienda →
                    </a>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-stone-400 mt-2 text-right">
        Precios Mercadona reales · otros supermercados estimados (OCU 2024)
      </p>
    </div>
  );
}
