"use client";
import { useState, useEffect } from "react";

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
}

interface CartItem {
  product: FinishedProduct;
  quantity: number;
}

export default function ShopPage() {
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [requestModal, setRequestModal] = useState<string | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/finished-products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function addToCart(product: FinishedProduct) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.portionsRemaining);
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: newQty } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  function changeQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.product.portionsRemaining) return c;
          return { ...c, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.product.pricePerPortion * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  async function handleCheckout() {
    setPurchasing(true);
    setError("");
    for (const item of cart) {
      const res = await fetch(`/api/finished-products/${item.product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler bei der Bestellung");
        setPurchasing(false);
        return;
      }
    }
    setCart([]);
    setOrdered(true);
    setShowCart(false);
    setPurchasing(false);
    load();
    setTimeout(() => setOrdered(false), 5000);
  }

  async function sendRequest(productName: string) {
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, message: requestMsg }),
      });
      if (!res.ok) throw new Error("Anfrage fehlgeschlagen");
    } catch {
      // Silently fail - request is best-effort
    } finally {
      setRequestModal(null);
      setRequestMsg("");
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false)
    );
  });
  const available = filteredProducts.filter((p) => p.portionsRemaining > 0);
  const unavailable = filteredProducts.filter((p) => p.portionsRemaining === 0);

  if (loading) return <div className="text-gray-400 py-8 text-center">Lade...</div>;

  return (
    <div className="space-y-6">
      {ordered && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-800 font-medium text-center">
          ✅ Bestellung erfolgreich! Danke! 🎉
        </div>
      )}

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full shadow-xl px-5 py-4 text-sm font-bold z-20 flex items-center gap-2"
        >
          🛒 <span>{cartCount}</span>
          <span>€{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Warenkorb</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-500">€{item.product.pricePerPortion.toFixed(2)} / Port.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(item.product.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">−</button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => changeQty(item.product.id, 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">+</button>
                </div>
                <span className="text-sm font-semibold w-16 text-right">
                  €{(item.product.pricePerPortion * item.quantity).toFixed(2)}
                </span>
                <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
              </div>
            ))}
            <div className="flex items-center justify-between text-lg font-bold pt-2">
              <span>Gesamt</span>
              <span className="text-emerald-700">€{cartTotal.toFixed(2)}</span>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={purchasing}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {purchasing ? "Bestelle..." : "Jetzt bestellen"}
            </button>
          </div>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold">Anfrage senden</h2>
            <p className="text-sm text-gray-600">
              Du möchtest <strong>{requestModal}</strong> anfragen?
            </p>
            <textarea
              value={requestMsg}
              onChange={(e) => setRequestMsg(e.target.value)}
              placeholder="Optionale Nachricht..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => sendRequest(requestModal)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700"
              >
                Anfragen
              </button>
              <button
                onClick={() => { setRequestModal(null); setRequestMsg(""); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-800">Verfügbare Gerichte</h1>
        <p className="text-sm text-gray-500">Frisch gekocht &amp; eingelagert</p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Produkte suchen..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {available.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          Aktuell sind keine Gerichte verfügbar.
        </div>
      )}

      <div className="space-y-3">
        {available.map((p) => {
          const inCart = cart.find((c) => c.product.id === p.id);
          const expiring =
            new Date(p.bestBefore).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 shadow-sm">
              <div className="text-3xl self-start mt-1">
                {p.storageType === "FREEZER" ? "❄️" : "🧊"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 truncate">{p.name}</h2>
                {p.category && (
                  <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1">
                    {p.category}
                  </span>
                )}
                <div className="text-sm text-gray-500 mt-1 space-x-3">
                  <span>{p.portionsRemaining} Port. verfügbar</span>
                  <span className={expiring ? "text-amber-600 font-medium" : ""}>
                    MHD: {new Date(p.bestBefore).toLocaleDateString("de-DE")}
                    {expiring && " ⚠️"}
                  </span>
                </div>
                <div className="text-emerald-700 font-bold text-lg mt-1">
                  €{p.pricePerPortion.toFixed(2)}
                  <span className="text-gray-400 text-sm font-normal"> / Port.</span>
                </div>
                {(p.freezerInstructions || p.vacuumInstructions) && (
                  <div className="mt-2 space-y-1 text-xs text-gray-500 border-t border-gray-100 pt-2">
                    {p.freezerInstructions && (
                      <div><span className="font-medium text-gray-600">❄️ TK-Anleitung:</span> {p.freezerInstructions}</div>
                    )}
                    {p.vacuumInstructions && (
                      <div><span className="font-medium text-gray-600">📦 Vakuum-Anleitung:</span> {p.vacuumInstructions}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 self-center">
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(p.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 font-bold">−</button>
                    <span className="font-semibold">{inCart.quantity}</span>
                    <button onClick={() => changeQty(p.id, 1)} className="w-8 h-8 rounded-full bg-gray-100 font-bold">+</button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(p)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 whitespace-nowrap"
                  >
                    + Warenkorb
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unavailable.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">
            Nicht verfügbar – anfragbar
          </h2>
          {unavailable.map((p) => (
            <div
              key={p.id}
              className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-3 opacity-70"
            >
              <div className="text-3xl self-start mt-1">
                {p.storageType === "FREEZER" ? "❄️" : "🧊"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 truncate">{p.name}</h2>
                <div className="text-sm text-red-500 mt-1 font-medium">Ausverkauft</div>
              </div>
              <button
                onClick={() => setRequestModal(p.name)}
                className="self-center bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-amber-200 whitespace-nowrap"
              >
                📬 Anfragen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
