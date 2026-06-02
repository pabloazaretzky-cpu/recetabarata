import type { IngredientCategory, SupermarketId } from "@/lib/types";

export interface SupermarketInfo {
  id: SupermarketId;
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  distance: string;
  address: string;
}

export const supermarkets: SupermarketInfo[] = [
  {
    id: "mercadona",
    name: "Mercadona",
    logo: "M",
    color: "#00833e",
    bgColor: "bg-green-600",
    textColor: "text-green-700",
    borderColor: "border-green-500",
    distance: "320m",
    address: "Calle Mayor 15",
  },
  {
    id: "lidl",
    name: "Lidl",
    logo: "L",
    color: "#0050aa",
    bgColor: "bg-blue-600",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
    distance: "650m",
    address: "Av. de la Constitución 8",
  },
  {
    id: "dia",
    name: "Dia",
    logo: "D",
    color: "#e60000",
    bgColor: "bg-red-600",
    textColor: "text-red-700",
    borderColor: "border-red-500",
    distance: "430m",
    address: "Paseo de Gracia 22",
  },
  {
    id: "alcampo",
    name: "Alcampo",
    logo: "A",
    color: "#ff6600",
    bgColor: "bg-orange-500",
    textColor: "text-orange-700",
    borderColor: "border-orange-500",
    distance: "1.1km",
    address: "Centro Comercial Norte",
  },
  {
    id: "carrefour",
    name: "Carrefour",
    logo: "C",
    color: "#004a97",
    bgColor: "bg-indigo-600",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-500",
    distance: "1.4km",
    address: "Ronda de Segovia 4",
  },
];

// Price multipliers relative to Mercadona (1.0 = same price as Mercadona)
// Based on OCU "El super más barato" 2023-2024 and Facua annual studies
export const PRICE_MULTIPLIERS: Record<
  SupermarketId,
  Record<IngredientCategory, number>
> = {
  // Mercadona: baseline (real prices fetched from their API)
  mercadona: {
    verduras: 1.00,
    frutas: 1.00,
    carnes: 1.00,
    pescados: 1.00,
    lácteos: 1.00,
    cereales: 1.00,
    especias: 1.00,
    otros: 1.00,
  },
  // Lidl: 15-25% cheaper on most categories (especially fresh produce & dairy)
  lidl: {
    verduras: 0.80,
    frutas: 0.76,
    carnes: 0.87,
    pescados: 0.90,
    lácteos: 0.78,
    cereales: 0.84,
    especias: 0.86,
    otros: 0.83,
  },
  // Dia: 7-13% cheaper on average, strong on dairy and cereals
  dia: {
    verduras: 0.91,
    frutas: 0.90,
    carnes: 0.93,
    pescados: 0.95,
    lácteos: 0.88,
    cereales: 0.89,
    especias: 0.93,
    otros: 0.91,
  },
  // Alcampo: 3-8% cheaper, competitive on meat and fish
  alcampo: {
    verduras: 0.95,
    frutas: 0.94,
    carnes: 0.94,
    pescados: 0.93,
    lácteos: 0.96,
    cereales: 0.95,
    especias: 0.97,
    otros: 0.95,
  },
  // Carrefour: 8-15% more expensive, premium positioning
  carrefour: {
    verduras: 1.11,
    frutas: 1.09,
    carnes: 1.13,
    pescados: 1.16,
    lácteos: 1.10,
    cereales: 1.08,
    especias: 1.11,
    otros: 1.10,
  },
};
