import { prisma } from "@/lib/prisma";
import RecipeForm from "@/components/admin/RecipeForm";
import { notFound } from "next/navigation";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, ingredients] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: Number(id) },
      include: { ingredients: { include: { ingredient: true } } },
    }),
    prisma.baseIngredient.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!recipe) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Rezept bearbeiten</h1>
        <p className="text-gray-500 text-sm">{recipe.name}</p>
      </div>
      <RecipeForm
        ingredients={ingredients}
        initialData={{
          id: recipe.id,
          name: recipe.name,
          description: recipe.description ?? "",
          servings: recipe.servings,
          instructions: recipe.instructions ?? "",
          ingredients: recipe.ingredients.map((ri) => ({
            ingredientId: ri.ingredientId,
            quantity: ri.quantity,
          })),
        }}
      />
    </div>
  );
}
