"use client";
import { useState, useEffect } from "react";

interface Recipe {
  id: number;
  name: string;
  servings: number;
  category?: string | null;
}

const PRODUCT_CATEGORIES = [
  "Hauptgericht",
  "Beilage",
  "Suppe",
  "Salat",
  "Dessert",
  "Snack",
  "Frühstück",
  "Getränk",
  "Sonstiges",
];

interface FinishedProduct {
  id: number;
  name: string;
  category: string | null;
  portionsTotal: number;
  portionsRemaining: number;
  storageType: string;
  bestBefore: string;
  pricePerPortion: number;
  freezerInstructions: string | null;
  vacuumInstructions: string | null;
  recipe: Recipe;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    recipeId: "",
    name: "",
    category: "",
    portionsTotal: 4,
    storageType: "FRIDGE",
    bestBefore: "",
    freezerInstructions: "",
    vacuumInstructions: "",
  });

  async function load() {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/finished-products"),
      fetch("/api/recipes"),
    ]);
    setProducts(await pRes.json());
    setRecipes(await rRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/finished-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, portionsTotal: Number(form.portionsTotal) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ recipeId: "", name: "", category: "", portionsTotal: 4, storageType: "FRIDGE", bestBefore: "", freezerInstructions: "", vacuumInstructions: "" });
      load();
    } else {
      const data = await res.json();
      setError(data.error ?? "Fehler");
    }
    setSaving(false);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Produkt "${name}" löschen?`)) return;
    await fetch(`/api/finished-products/${id}`, { method: "DELETE" });
    load();
  }

  function isExpiringSoon(date: string): boolean {
    const diff = new Date(date).getTime() - Date.now();
    return diff < 1000 * 60 * 60 * 24 * 3; // 3 days
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Lade...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lager</h1>
          <p className="text-gray-500 text-sm">Fertigprodukte verwalten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          🍳 Rezept kochen
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Rezept kochen & einlagern</h2>
          <form onSubmit={handleCook} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rezept *</label>
              <select
                value={form.recipeId}
                onChange={(e) => {
                  const recipe = recipes.find((r) => r.id === Number(e.target.value));
                  setForm({
                    ...form,
                    recipeId: e.target.value,
                    name: recipe?.name ?? "",
                    category: recipe?.category ?? "",
                    portionsTotal: recipe?.servings ?? 4,
                  });
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Rezept auswählen...</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produktname *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="z.B. Hähnchen-Curry (4 Port.)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Portionen *</label>
              <input
                type="number"
                min={1}
                value={form.portionsTotal}
                onChange={(e) => setForm({ ...form, portionsTotal: Number(e.target.value) })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lagerort *</label>
              <select
                value={form.storageType}
                onChange={(e) => setForm({ ...form, storageType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="FRIDGE">🧊 Kühlschrank</option>
                <option value="FREEZER">❄️ Tiefkühlung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Keine Kategorie</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">MHD *</label>
              <input
                type="date"
                value={form.bestBefore}
                onChange={(e) => setForm({ ...form, bestBefore: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">TK-Anleitung</label>
              <textarea
                value={form.freezerInstructions}
                onChange={(e) => setForm({ ...form, freezerInstructions: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Anleitung zur Tiefkühl-Nutzung..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vakuum-Anleitung</label>
              <textarea
                value={form.vacuumInstructions}
                onChange={(e) => setForm({ ...form, vacuumInstructions: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Anleitung zur Vakuumierung..."
              />
            </div>
            {error && <p className="sm:col-span-2 text-red-500 text-sm">{error}</p>}
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Einlagern..." : "Einlagern"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            Keine Fertigprodukte im Lager.
          </div>
        ) : (
          products.map((p) => {
            const expiring = isExpiringSoon(p.bestBefore);
            const expired = new Date(p.bestBefore) < new Date();
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border p-5 space-y-3 ${
                  expired ? "border-red-300" : expiring ? "border-amber-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  <span className="text-xl">{p.storageType === "FREEZER" ? "❄️" : "🧊"}</span>
                </div>
                {p.category && (
                  <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                )}
                <div className="text-sm space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Portionen:</span>
                    <span className="font-medium">{p.portionsRemaining} / {p.portionsTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MHD:</span>
                    <span className={expired ? "text-red-600 font-medium" : expiring ? "text-amber-600 font-medium" : ""}>
                      {new Date(p.bestBefore).toLocaleDateString("de-DE")}
                      {expired && " ⚠️ abgelaufen"}
                      {!expired && expiring && " ⚠️ bald"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preis/Port.:</span>
                    <span className="font-medium text-emerald-700">€{p.pricePerPortion.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(p.portionsRemaining / p.portionsTotal) * 100}%` }}
                  />
                </div>
                {(p.freezerInstructions || p.vacuumInstructions) && (
                  <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-2">
                    {p.freezerInstructions && (
                      <div><span className="font-medium text-gray-600">❄️ TK:</span> {p.freezerInstructions}</div>
                    )}
                    {p.vacuumInstructions && (
                      <div><span className="font-medium text-gray-600">📦 Vakuum:</span> {p.vacuumInstructions}</div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="w-full text-sm text-red-500 hover:text-red-700 py-1.5 border border-red-200 hover:bg-red-50 rounded-lg"
                >
                  Löschen
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
