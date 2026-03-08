"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShopLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "shop", pin }),
    });
    if (res.ok) {
      router.push("/shop");
    } else {
      const data = await res.json();
      setError(data.error ?? "Anmeldung fehlgeschlagen");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-emerald-800">MealPrep Shop</h1>
          <p className="text-gray-500 text-sm mt-1">Für unsere Freunde</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop-PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-2xl tracking-widest"
              placeholder="PIN"
              maxLength={10}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 text-lg"
          >
            {loading ? "..." : "Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
