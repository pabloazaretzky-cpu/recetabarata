"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export default function ServingsSelector({
  value,
  min = 1,
  max = 20,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-orange-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-xl font-bold text-stone-900">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-orange-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
