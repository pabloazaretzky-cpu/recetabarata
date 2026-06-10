import type { MetadataRoute } from "next";
import { recipes } from "@/lib/data/recipes";
import { SITE_URL } from "@/lib/seo";

const LAST_MODIFIED = "2025-01-01";

export default function sitemap(): MetadataRoute.Sitemap {
  const recipeUrls: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${SITE_URL}/recipes/${r.id}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    { url: SITE_URL,              lastModified: LAST_MODIFIED, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/suggest`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    ...recipeUrls,
  ];
}
