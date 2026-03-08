"use client";
import { useState } from "react";
import Link from "next/link";
import DeleteRecipeButton from "./DeleteRecipeButton";

interface RecipeData {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  servings: number;
  prepTime: number | null;
  totalTime: number | null;
  ingredientCount: number;
  materialCost: number;
  pricePerPortion: number;
}

export default function RecipeListClient({ recipes }: { recipes: RecipeData[] }) {
  const [search, setSearch] = useState("");

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false) ||
      (r.category?.toLowerCase().includes(q) ?? false)
    );
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

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rezepte suchen..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-lg">Noch keine Rezepte vorhanden.</p>
          <Link href="/admin/recipes/new" className="text-emerald-600 text-sm mt-2 block hover:underline">
            Erstes Rezept erstellen →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          Keine Rezepte gefunden für &quot;{search}&quot;.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
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
              {recipe.category && (
                <span className="inline-block self-start text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {recipe.category}
                </span>
              )}
              {recipe.description && (
                <p className="text-gray-500 text-sm line-clamp-2">{recipe.description}</p>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-medium">{recipe.ingredientCount}</span> Zutaten ·{" "}
                <span className="font-medium">€{recipe.materialCost.toFixed(2)}</span> Materialkosten ·{" "}
                <span className="font-medium text-emerald-700">€{recipe.pricePerPortion.toFixed(2)}</span>/Port.
              </div>
              {(recipe.prepTime || recipe.totalTime) && (
                <div className="text-xs text-gray-500">
                  {recipe.prepTime && <span>⏱ Arbeitszeit: {recipe.prepTime} Min.</span>}
                  {recipe.prepTime && recipe.totalTime && <span> · </span>}
                  {recipe.totalTime && <span>⏲ Gesamt: {recipe.totalTime} Min.</span>}
                </div>
              )}
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
          ))}
        </div>
      )}
    </div>
  );
}
