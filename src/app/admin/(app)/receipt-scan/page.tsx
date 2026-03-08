"use client";
import { useState, useRef } from "react";

interface OcrItem {
  name: string;
  price: number | null;
}

interface IngredientMatch {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
}

export default function ReceiptScanPage() {
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<OcrItem[]>([]);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [ingredients, setIngredients] = useState<IngredientMatch[]>([]);
  const [matchMap, setMatchMap] = useState<Record<number, { ingredientId: string; quantity: string }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadIngredients() {
    const res = await fetch("/api/ingredients");
    setIngredients(await res.json());
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setItems([]);
    setError("");
    setRawText("");
    setSavedIds(new Set());
    setMatchMap({});
    await loadIngredients();

    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/receipt", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
      setRawText(data.rawText ?? "");
    } else {
      const data = await res.json();
      setError(data.error ?? "OCR fehlgeschlagen");
    }
    setScanning(false);
  }

  async function saveItem(index: number) {
    const match = matchMap[index];
    if (!match?.ingredientId) return;
    setSaving(index);
    // Update price for the ingredient
    const ingredient = ingredients.find((i) => i.id === Number(match.ingredientId));
    if (!ingredient) { setSaving(null); return; }
    const qty = parseFloat(match.quantity) || 1;
    const price = items[index].price;
    if (price === null || qty <= 0) { setSaving(null); return; }
    const pricePerUnit = price / qty;
    await fetch(`/api/ingredients/${match.ingredientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ingredient.name,
        unit: ingredient.unit,
        pricePerUnit,
        stockQuantity: ingredient.stockQuantity,
      }),
    });
    setSavedIds((prev) => new Set([...prev, index]));
    setSaving(null);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Kassenbon scannen</h1>
        <p className="text-gray-500 text-sm">Bon fotografieren und Preise automatisch erfassen</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-gray-600 font-medium">Kassenbon hochladen</p>
          <p className="text-gray-400 text-sm mt-1">JPG, PNG, HEIC – Klicken oder hierher ziehen</p>
        </div>
        {scanning && (
          <div className="mt-4 text-center text-emerald-600 animate-pulse font-medium">
            OCR läuft... (kann einige Sekunden dauern)
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>
        )}
      </div>

      {/* Results */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Erkannte Artikel ({items.length})</h2>
          <p className="text-gray-500 text-sm">
            Ordne jeden Artikel einer Grundzutat zu und speichere den Preis.
          </p>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 space-y-3 ${
                  savedIds.has(idx) ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.price !== null && (
                      <p className="text-sm text-gray-500">Preis: €{item.price.toFixed(2)}</p>
                    )}
                  </div>
                  {savedIds.has(idx) && (
                    <span className="text-emerald-600 text-sm font-medium">✓ Gespeichert</span>
                  )}
                </div>
                {!savedIds.has(idx) && item.price !== null && (
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={matchMap[idx]?.ingredientId ?? ""}
                      onChange={(e) =>
                        setMatchMap((prev) => ({
                          ...prev,
                          [idx]: { ...prev[idx], ingredientId: e.target.value, quantity: prev[idx]?.quantity ?? "1" },
                        }))
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Zutat zuordnen...</option>
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0.001}
                      step="0.001"
                      placeholder="Menge"
                      value={matchMap[idx]?.quantity ?? "1"}
                      onChange={(e) =>
                        setMatchMap((prev) => ({
                          ...prev,
                          [idx]: { ...prev[idx], quantity: e.target.value, ingredientId: prev[idx]?.ingredientId ?? "" },
                        }))
                      }
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => saveItem(idx)}
                      disabled={saving === idx || !matchMap[idx]?.ingredientId}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving === idx ? "..." : "Preis speichern"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {rawText && (
        <details className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm text-gray-500 font-medium">
            Roher OCR-Text anzeigen
          </summary>
          <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap font-mono">{rawText}</pre>
        </details>
      )}
    </div>
  );
}
