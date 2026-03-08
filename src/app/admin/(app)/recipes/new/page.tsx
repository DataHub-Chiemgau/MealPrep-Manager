import { prisma } from "@/lib/prisma";
import RecipeForm from "@/components/admin/RecipeForm";

export default async function NewRecipePage() {
  const ingredients = await prisma.baseIngredient.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Neues Rezept</h1>
      </div>
      <RecipeForm ingredients={ingredients} />
    </div>
  );
}
