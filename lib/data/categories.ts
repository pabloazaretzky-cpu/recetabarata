import type { CategoryId } from "@/lib/types";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  textColor: string;
}

export const categories: Category[] = [
  {
    id: "rapidas",
    name: "Saludables en 5 min",
    emoji: "⚡",
    description: "Nutritivas y listas en un momento",
    gradient: "from-emerald-400 to-teal-500",
    textColor: "text-emerald-700",
  },
  {
    id: "espanola",
    name: "Cocina Española",
    emoji: "🇪🇸",
    description: "Los clásicos de toda la vida",
    gradient: "from-red-400 to-orange-500",
    textColor: "text-red-700",
  },
  {
    id: "asiatica",
    name: "Asiáticas",
    emoji: "🍜",
    description: "Sabores del sudeste asiático",
    gradient: "from-orange-400 to-amber-500",
    textColor: "text-orange-700",
  },
  {
    id: "japonesa",
    name: "Japonesas",
    emoji: "🍣",
    description: "La precisión de la cocina japonesa",
    gradient: "from-pink-400 to-rose-500",
    textColor: "text-pink-700",
  },
  {
    id: "italiana",
    name: "Italianas",
    emoji: "🍝",
    description: "La auténtica cocina italiana",
    gradient: "from-green-500 to-emerald-600",
    textColor: "text-green-700",
  },
  {
    id: "vegana",
    name: "Veganas",
    emoji: "🌱",
    description: "Plant-based y deliciosas",
    gradient: "from-lime-400 to-green-500",
    textColor: "text-lime-700",
  },
];

export function getCategoryById(id: CategoryId): Category {
  return categories.find((c) => c.id === id)!;
}
