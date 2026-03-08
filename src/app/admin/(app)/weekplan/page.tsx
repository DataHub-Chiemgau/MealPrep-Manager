"use client";
import { useState, useEffect } from "react";

interface Recipe {
  id: number;
  name: string;
  servings: number;
}

interface WeekPlanEntry {
  id: number;
  dayOfWeek: number;
  mealSlot: string;
  recipeId: number;
  recipe: Recipe;
}

interface ShoppingItem {
  id: number;
  requiredQuantity: number;
  checkedOff: boolean;
  ingredient: { name: string; unit: string };
}

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MEALS = ["Mittagessen", "Abendessen"];

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export default function WeekPlanPage() {
  const [weekStart, setWeekStart] = useState(getMondayOfCurrentWeek);
  const [entries, setEntries] = useState<WeekPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number; meal: string } | null>(null);

  async function loadEntries() {
    const res = await fetch(`/api/weekplan?weekStart=${weekStart}`);
    setEntries(await res.json());
  }

  async function loadShopping() {
    const res = await fetch(`/api/shopping-list?weekStart=${weekStart}`);
    const data = await res.json();
    setShoppingList(Array.isArray(data) ? data : []);
  }

  async function loadRecipes() {
    const res = await fetch("/api/recipes");
    setRecipes(await res.json());
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEntries(), loadRecipes(), loadShopping()]).then(() => setLoading(false));
  }, [weekStart]);

  function getEntry(day: number, meal: string) {
    return entries.find((e) => e.dayOfWeek === day && e.mealSlot === meal);
  }

  async function setRecipeForSlot(day: number, meal: string, recipeId: number | null) {
    await fetch("/api/weekplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, dayOfWeek: day, mealSlot: meal, recipeId }),
    });
    setActiveCell(null);
    await loadEntries();
  }

  async function generateShoppingList() {
    setGenerating(true);
    await fetch("/api/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    await loadShopping();
    setGenerating(false);
  }

  async function toggleItem(id: number, checked: boolean) {
    await fetch("/api/shopping-list", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checkedOff: checked }),
    });
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checkedOff: checked } : item))
    );
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Lade...</div>;

  const weekDate = new Date(weekStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wochenplan</h1>
          <p className="text-gray-500 text-sm">KW ab {weekDate.toLocaleDateString("de-DE")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Woche:</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Week grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-32">Tag</th>
              {MEALS.map((m) => (
                <th key={m} className="text-left px-4 py-3 text-gray-600 font-medium">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIdx) => (
              <tr key={day} className={dayIdx % 2 === 0 ? "" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-700">{day}</td>
                {MEALS.map((meal) => {
                  const entry = getEntry(dayIdx, meal);
                  const isActive = activeCell?.day === dayIdx && activeCell?.meal === meal;
                  return (
                    <td key={meal} className="px-4 py-3">
                      {isActive ? (
                        <div className="flex gap-2">
                          <select
                            autoFocus
                            className="flex-1 border border-emerald-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            defaultValue={entry?.recipeId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecipeForSlot(dayIdx, meal, val ? Number(val) : null);
                            }}
                          >
                            <option value="">— Kein Rezept —</option>
                            {recipes.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setActiveCell(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveCell({ day: dayIdx, meal })}
                          className={`w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors ${
                            entry
                              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "text-gray-300 hover:bg-gray-100 hover:text-gray-500 border border-dashed border-gray-200"
                          }`}
                        >
                          {entry ? entry.recipe.name : "+ Rezept wählen"}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shopping list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Einkaufsliste</h2>
          <button
            onClick={generateShoppingList}
            disabled={generating}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? "Berechne..." : "🛒 Liste generieren"}
          </button>
        </div>
        {shoppingList.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Klicke "Liste generieren" um fehlende Zutaten zu berechnen.
          </p>
        ) : (
          <ul className="space-y-2">
            {shoppingList.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.checkedOff}
                  onChange={(e) => toggleItem(item.id, e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className={`text-sm flex-1 ${item.checkedOff ? "line-through text-gray-400" : ""}`}>
                  {item.ingredient.name}
                </span>
                <span className="text-sm text-gray-500">
                  {item.requiredQuantity} {item.ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
