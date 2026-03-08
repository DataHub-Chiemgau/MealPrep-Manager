"use client";
import { useState, useEffect } from "react";

interface BaseIngredient {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
  stockQuantity: number;
}

const UNITS = ["g", "kg", "ml", "l", "Stück", "Portion", "EL", "TL", "Prise", "Packung"];

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<BaseIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", unit: "g", pricePerUnit: 0, stockQuantity: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/ingredients");
    setIngredients(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setForm({ name: "", unit: "g", pricePerUnit: 0, stockQuantity: 0 });
    setShowForm(true);
    setError("");
  }

  function openEdit(ing: BaseIngredient) {
    setEditId(ing.id);
    setForm({ name: ing.name, unit: ing.unit, pricePerUnit: ing.pricePerUnit, stockQuantity: ing.stockQuantity });
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editId ? `/api/ingredients/${editId}` : "/api/ingredients";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      load();
    } else {
      const data = await res.json();
      setError(data.error ?? "Fehler");
    }
    setSaving(false);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Zutat "${name}" löschen?`)) return;
    await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Lade...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grundzutaten</h1>
          <p className="text-gray-500 text-sm">{ingredients.length} Zutaten</p>
        </div>
        <button
          onClick={openNew}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + Neue Zutat
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editId ? "Zutat bearbeiten" : "Neue Zutat"}
          </h2>
          <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="z.B. Reis"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Einheit *</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preis pro Einheit (€)
              </label>
              <input
                type="number"
                min={0}
                step="0.001"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lagerbestand
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="sm:col-span-2 text-red-500 text-sm">{error}</p>}
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Speichern"}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {ingredients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Noch keine Zutaten angelegt.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Einheit</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Preis/E</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Bestand</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing, i) => (
                <tr key={ing.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-gray-800">{ing.name}</td>
                  <td className="px-4 py-3 text-gray-500">{ing.unit}</td>
                  <td className="px-4 py-3 text-right">€{ing.pricePerUnit.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={ing.stockQuantity <= 0 ? "text-red-500 font-medium" : "text-gray-700"}>
                      {ing.stockQuantity} {ing.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(ing)}
                        className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 border border-gray-200 rounded"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(ing.id, ing.name)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
