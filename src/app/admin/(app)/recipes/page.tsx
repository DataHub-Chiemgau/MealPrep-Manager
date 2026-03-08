import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteRecipeButton from "./DeleteRecipeButton";
import { PRICE_MARKUP } from "@/lib/pricing";
import RecipeListClient from "./RecipeListClient";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: { include: { ingredient: true } },
      _count: { select: { finishedProducts: true } },
    },
    orderBy: { name: "asc" },
  });

  const recipesWithCost = recipes.map((recipe) => {
    const materialCost = recipe.ingredients.reduce(
      (sum, ri) => sum + ri.quantity * ri.ingredient.pricePerUnit,
      0
    );
    const pricePerPortion = recipe.servings > 0
      ? (materialCost / recipe.servings) * PRICE_MARKUP
      : 0;
    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      totalTime: recipe.totalTime,
      ingredientCount: recipe.ingredients.length,
      materialCost,
      pricePerPortion,
    };
  });

  return <RecipeListClient recipes={recipesWithCost} />;
}
