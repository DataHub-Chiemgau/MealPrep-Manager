import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteRecipeButton from "./DeleteRecipeButton";
import { PRICE_MARKUP } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: { include: { ingredient: true } },
      _count: { select: { finishedProducts: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rezepte</h1>
          <p className="text-gray-500 text-sm">{recipes.length} Rezepte gespeichert</p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + Neues Rezept
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-lg">Noch keine Rezepte vorhanden.</p>
          <Link href="/admin/recipes/new" className="text-emerald-600 text-sm mt-2 block hover:underline">
            Erstes Rezept erstellen →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const materialCost = recipe.ingredients.reduce(
              (sum, ri) => sum + ri.quantity * ri.ingredient.pricePerUnit,
              0
            );
            const pricePerPortion = recipe.servings > 0
              ? (materialCost / recipe.servings) * PRICE_MARKUP
              : 0;

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-800 leading-tight">{recipe.name}</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap">
                    {recipe.servings} Port.
                  </span>
                </div>
                {recipe.description && (
                  <p className="text-gray-500 text-sm line-clamp-2">{recipe.description}</p>
                )}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{recipe.ingredients.length}</span> Zutaten ·{" "}
                  <span className="font-medium">€{materialCost.toFixed(2)}</span> Materialkosten ·{" "}
                  <span className="font-medium text-emerald-700">€{pricePerPortion.toFixed(2)}</span>/Port.
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <Link
                    href={`/admin/recipes/${recipe.id}`}
                    className="flex-1 text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg"
                  >
                    Bearbeiten
                  </Link>
                  <DeleteRecipeButton id={recipe.id} name={recipe.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
