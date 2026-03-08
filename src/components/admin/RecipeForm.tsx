"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_MARKUP } from "@/lib/pricing";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
}

interface RecipeIngredientRow {
  ingredientId: number;
  quantity: number;
}

interface RecipeFormProps {
  ingredients: Ingredient[];
  initialData?: {
    id?: number;
    name: string;
    description: string;
    servings: number;
    instructions: string;
    ingredients: RecipeIngredientRow[];
  };
}

export default function RecipeForm({ ingredients, initialData }: RecipeFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? 4);
  const [instructions, setInstructions] = useState(initialData?.instructions ?? "");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientRow[]>(
    initialData?.ingredients ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addIngredient() {
    if (ingredients.length === 0) return;
    setRecipeIngredients((prev) => [
      ...prev,
      { ingredientId: ingredients[0].id, quantity: 1 },
    ]);
  }

  function removeIngredient(index: number) {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof RecipeIngredientRow, value: number) {
    setRecipeIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function getIngredient(id: number) {
    return ingredients.find((i) => i.id === id);
  }

  const materialCost = recipeIngredients.reduce((sum, ri) => {
    const ing = getIngredient(ri.ingredientId);
    return sum + (ing ? ri.quantity * ing.pricePerUnit : 0);
  }, 0);
  const pricePerPortion = servings > 0 ? (materialCost / servings) * PRICE_MARKUP : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = { name, description, servings, instructions, ingredients: recipeIngredients };
    const url = isEdit ? `/api/recipes/${initialData!.id}` : "/api/recipes";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push("/admin/recipes");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Fehler beim Speichern");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Grunddaten</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="z.B. Hähnchen-Curry"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Kurze Beschreibung..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portionen *</label>
          <input
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            required
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zubereitung</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Schritt-für-Schritt Anleitung..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Zutaten</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + Zutat hinzufügen
          </button>
        </div>

        {ingredients.length === 0 && (
          <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3">
            Zuerst Grundzutaten anlegen unter{" "}
            <a href="/admin/ingredients" className="underline">Zutaten</a>.
          </p>
        )}

        {recipeIngredients.length === 0 && ingredients.length > 0 && (
          <p className="text-gray-400 text-sm">Noch keine Zutaten hinzugefügt.</p>
        )}

        <div className="space-y-2">
          {recipeIngredients.map((ri, index) => {
            const ing = getIngredient(ri.ingredientId);
            return (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={ri.ingredientId}
                  onChange={(e) => updateIngredient(index, "ingredientId", Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ri.quantity}
                  onChange={(e) => updateIngredient(index, "quantity", Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-gray-500 text-sm w-12">{ing?.unit ?? ""}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="text-red-500 hover:text-red-700 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-100 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Materialkosten gesamt:</span>
            <span className="font-medium">€{materialCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Verkaufspreis / Portion (+20%):</span>
            <span className="font-semibold text-emerald-700">€{pricePerPortion.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? "Speichern..." : isEdit ? "Änderungen speichern" : "Rezept erstellen"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/recipes")}
          className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
