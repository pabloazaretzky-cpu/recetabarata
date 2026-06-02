"use client";

import { categories } from "@/lib/data/categories";
import type { CategoryId } from "@/lib/types";

interface Props {
  active: CategoryId | "all";
  onChange: (id: CategoryId | "all") => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange("all")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          active === "all"
            ? "bg-stone-900 text-white shadow-md scale-105"
            : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
        }`}
      >
        🍴 Todas
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            active === cat.id
              ? "bg-stone-900 text-white shadow-md scale-105"
              : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
          }`}
        >
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  );
}
