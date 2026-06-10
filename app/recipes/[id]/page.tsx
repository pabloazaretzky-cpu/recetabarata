import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRecipeById, recipes } from "@/lib/data/recipes";
import { getCategoryById } from "@/lib/data/categories";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { formatAmount } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import RecipeDetail from "@/components/RecipeDetail";

export async function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export async function generateMetadata(
  props: PageProps<"/recipes/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const recipe = getRecipeById(id);
  if (!recipe) return {};

  const title = `${recipe.name} — ${SITE_NAME}`;
  const description = `${recipe.description} Compara los ingredientes en Mercadona, Carrefour, Lidl, Dia y Alcampo para ahorrar en tu compra.`;
  const url = `${SITE_URL}/recipes/${recipe.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: recipe.name,
      description,
      url,
      siteName: SITE_NAME,
      locale: "es_ES",
      type: "article",
      images: [{ url: recipe.image, width: 800, height: 600, alt: recipe.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.name,
      description,
      images: [recipe.image],
    },
  };
}

async function fetchRecipeRating(recipeId: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase!
    .from("reviews")
    .select("rating")
    .eq("recipe_id", recipeId);
  if (!data || data.length === 0) return null;
  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return { avg: sum / data.length, count: data.length };
}

export default async function RecipeDetailPage(
  props: PageProps<"/recipes/[id]">
) {
  const { id } = await props.params;
  const recipe = getRecipeById(id);

  if (!recipe) notFound();

  const totalTime = recipe.prepTime + recipe.cookTime;
  const rating = await fetchRecipeRating(recipe.id);
  const categoryName = getCategoryById(recipe.category).name;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    image: recipe.image,
    url: `${SITE_URL}/recipes/${recipe.id}`,
    author: { "@type": "Organization", name: SITE_NAME },
    prepTime: `PT${recipe.prepTime}M`,
    cookTime: recipe.cookTime > 0 ? `PT${recipe.cookTime}M` : undefined,
    totalTime: `PT${totalTime}M`,
    recipeYield: `${recipe.baseServings} ${recipe.baseServings === 1 ? "porción" : "porciones"}`,
    recipeCategory: categoryName,
    nutrition: {
      "@type": "NutritionInformation",
      calories: `${recipe.calories} kcal`,
    },
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${formatAmount(ing.amount, ing.unit)} de ${ing.name}`
    ),
    recipeInstructions: recipe.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.avg.toFixed(1),
        reviewCount: rating.count,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecipeDetail recipe={recipe} />
    </>
  );
}
