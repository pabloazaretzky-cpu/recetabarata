// Awin affiliate integration for Spanish supermarkets
//
// Phase 1 (pre-approval): generates tracked search URLs — works immediately.
// Phase 2 (post-approval): fetches real product names & prices from Awin feeds.
//
// Required env vars (add to .env.local once approved):
//   AWIN_PUBLISHER_ID   — your numeric publisher ID from Awin dashboard
//   AWIN_API_KEY        — API key from Awin dashboard (for feed access)
//   AWIN_MID_CARREFOUR  — Merchant ID for Carrefour España (from Awin program page)
//   AWIN_MID_ALCAMPO    — Merchant ID for Alcampo
//   AWIN_FEED_CARREFOUR — Feed ID for Carrefour product feed (from Awin dashboard)
//   AWIN_FEED_ALCAMPO   — Feed ID for Alcampo product feed

import type { IngredientCategory, SupermarketId } from "@/lib/types";

const PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID ?? "";
const API_KEY = process.env.AWIN_API_KEY ?? "";

const MERCHANT_IDS: Partial<Record<SupermarketId, string>> = {
  carrefour: process.env.AWIN_MID_CARREFOUR,
  alcampo: process.env.AWIN_MID_ALCAMPO,
};

const FEED_IDS: Partial<Record<SupermarketId, string>> = {
  carrefour: process.env.AWIN_FEED_CARREFOUR,
  alcampo: process.env.AWIN_FEED_ALCAMPO,
};

// Direct search URLs for each supermarket (used as fallback and for Phase 1)
const SEARCH_URLS: Record<SupermarketId, string> = {
  mercadona: "https://tienda.mercadona.es/search?query=",
  carrefour: "https://www.carrefour.es/buscar?q=",
  alcampo: "https://www.alcampo.es/compra-online/buscar?q=",
  lidl: "https://www.lidl.es/p/?q=",
  dia: "https://www.dia.es/buscar?query=",
};

export const STORE_HOME_URLS: Record<SupermarketId, string> = {
  mercadona: "https://tienda.mercadona.es",
  carrefour: "https://www.carrefour.es/supermercado",
  alcampo: "https://www.alcampo.es/compra-online",
  lidl: "https://www.lidl.es",
  dia: "https://www.dia.es",
};

export function isAwinActive(): boolean {
  return Boolean(PUBLISHER_ID);
}

// Wraps a product/search URL with Awin tracking for the given supermarket.
// Falls back to direct URL if Awin is not configured or that merchant isn't enrolled.
export function makeAffiliateUrl(smId: SupermarketId, targetUrl: string): string {
  const mid = MERCHANT_IDS[smId];
  if (!isAwinActive() || !mid) return targetUrl;
  return `https://www.awin1.com/cread.php?awinaffid=${PUBLISHER_ID}&awinmid=${mid}&p=${encodeURIComponent(targetUrl)}`;
}

// Returns a tracked search URL for an ingredient in a given supermarket.
export function makeSearchUrl(smId: SupermarketId, ingredientName: string): string {
  const base = SEARCH_URLS[smId];
  const direct = `${base}${encodeURIComponent(ingredientName)}`;
  return makeAffiliateUrl(smId, direct);
}

// ─── Phase 2: real product matching from Awin feeds ──────────────────────────
// Activated automatically when AWIN_API_KEY + feed IDs are set.

export interface AwinPriceResult {
  price: number;
  productName: string;
  brandName: string;
  affiliateUrl: string;
}

interface AwinFeedItem {
  product_name: string;
  brand_name: string;
  search_price: string;
  aw_deep_link: string;
  category_name: string;
}

// In-process cache; feed is large so we cache aggressively
const feedCache = new Map<string, AwinFeedItem[]>();

async function fetchFeed(smId: SupermarketId): Promise<AwinFeedItem[]> {
  const feedId = FEED_IDS[smId];
  if (!feedId || !API_KEY) return [];
  if (feedCache.has(feedId)) return feedCache.get(feedId)!;

  try {
    // Awin CSV feed — adapt delimiter/compression params to what the advertiser uses
    const url =
      `https://productdata.awin.com/datafeed/download/apikey/${API_KEY}` +
      `/language/es/fid/${feedId}/format/json/`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) { feedCache.set(feedId, []); return []; }
    const data: AwinFeedItem[] = await res.json();
    feedCache.set(feedId, data);
    return data;
  } catch {
    feedCache.set(feedId, []);
    return [];
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(query: string, candidate: string): number {
  const qWords = normalize(query).split(" ").filter((w) => w.length > 2);
  const cWords = normalize(candidate).split(" ").filter((w) => w.length > 2);
  if (!qWords.length || !cWords.length) return 0;
  const matches = qWords.filter((w) => cWords.some((c) => c.includes(w) || w.includes(c))).length;
  const recall = matches / qWords.length;
  const precision = matches / cWords.length;
  if (!recall && !precision) return 0;
  return (2 * precision * recall) / (precision + recall);
}

export async function findAwinPrice(
  ingredientName: string,
  _category: IngredientCategory,
  smId: SupermarketId
): Promise<AwinPriceResult | null> {
  if (!API_KEY || !FEED_IDS[smId]) return null;

  const items = await fetchFeed(smId);
  let best: AwinFeedItem | null = null;
  let bestScore = 0;

  for (const item of items) {
    const score = scoreMatch(ingredientName, item.product_name);
    if (score > bestScore) { bestScore = score; best = item; }
  }

  if (!best || bestScore < 0.3) return null;

  const price = parseFloat(best.search_price) || 0;
  if (price <= 0) return null;

  return {
    price,
    productName: best.product_name,
    brandName: best.brand_name,
    affiliateUrl: makeAffiliateUrl(smId, best.aw_deep_link),
  };
}
