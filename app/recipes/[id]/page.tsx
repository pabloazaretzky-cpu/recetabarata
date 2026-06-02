import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/data/recipes";
import RecipeDetail from "@/components/RecipeDetail";

export default async function RecipeDetailPage(
  props: PageProps<"/recipes/[id]">
) {
  const { id } = await props.params;
  const recipe = getRecipeById(id);

  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
