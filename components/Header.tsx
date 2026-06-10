"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import { ShoppingCart, ChefHat, Lightbulb, CalendarDays, History, Users } from "lucide-react";

export default function Header() {
  const items = useCartStore((s) => s.items);
  const { defaultServings, setDefaultServings } = useSettingsStore();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-stone-900">
          <ChefHat className="w-7 h-7 text-orange-500" />
          <span>RecetaFácil</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* People selector */}
          <label className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 cursor-pointer transition-colors">
            <Users className="w-4 h-4 flex-shrink-0" />
            <select
              value={defaultServings}
              onChange={(e) => setDefaultServings(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-stone-600 focus:outline-none cursor-pointer appearance-none"
              title="Personas por defecto"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "pers." : "pers."}
                </option>
              ))}
            </select>
          </label>

          <div className="w-px h-5 bg-stone-200" />

          <Link
            href="/suggest"
            className="flex items-center gap-2 text-stone-600 hover:text-orange-600 font-medium text-sm transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden md:inline">¿Qué cocino?</span>
          </Link>

          <Link
            href="/planner"
            className="flex items-center gap-2 text-stone-600 hover:text-orange-600 font-medium text-sm transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden md:inline">Planificador</span>
          </Link>

          <Link
            href="/historial"
            className="flex items-center gap-2 text-stone-600 hover:text-orange-600 font-medium text-sm transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Historial</span>
          </Link>

          <Link
            href="/shopping-list"
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Lista de compras</span>
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
