import Image from "next/image";
import Link from "next/link";
import { Clock, Users, Flame } from "lucide-react";
import type { Recipe, RatingStats } from "@/lib/types";
import { getCategoryById } from "@/lib/data/categories";

interface Props {
  recipe: Recipe;
  rating?: RatingStats;
}

const difficultyColor = {
  fácil: "bg-green-100 text-green-700",
  media: "bg-yellow-100 text-yellow-700",
  difícil: "bg-red-100 text-red-700",
};

export default function RecipeCard({ recipe, rating }: Props) {
  const category = getCategoryById(recipe.category);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm ${category.textColor}`}
          >
            {category.emoji} {category.name}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColor[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-base leading-tight mb-1 group-hover:text-orange-600 transition-colors">
          {recipe.emoji} {recipe.name}
        </h3>
        <p className="text-stone-500 text-sm line-clamp-2 mb-3">
          {recipe.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {recipe.prepTime + recipe.cookTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {recipe.baseServings} pers.
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {recipe.calories} kcal
          </span>
        </div>
        {rating && rating.count > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs font-medium text-stone-700">
              {rating.avg.toFixed(1)}
            </span>
            <span className="text-xs text-stone-400">({rating.count})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
