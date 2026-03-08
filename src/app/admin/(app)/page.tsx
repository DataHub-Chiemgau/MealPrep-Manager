import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [recipes, ingredients, products, requests] = await Promise.all([
    prisma.recipe.count(),
    prisma.baseIngredient.count(),
    prisma.finishedProduct.count({ where: { portionsRemaining: { gt: 0 } } }),
    prisma.productRequest.count({ where: { handled: false } }),
  ]);

  const pendingRequests = await prisma.productRequest.findMany({
    where: { handled: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const availableProducts = await prisma.finishedProduct.findMany({
    where: { portionsRemaining: { gt: 0 } },
    include: { recipe: true },
    orderBy: { bestBefore: "asc" },
    take: 5,
  });

  const stats = [
    { label: "Rezepte", value: recipes, icon: "📖", href: "/admin/recipes", color: "bg-blue-50 text-blue-700" },
    { label: "Grundzutaten", value: ingredients, icon: "🥗", href: "/admin/ingredients", color: "bg-green-50 text-green-700" },
    { label: "Verfügbare Produkte", value: products, icon: "📦", href: "/admin/inventory", color: "bg-yellow-50 text-yellow-700" },
    { label: "Offene Anfragen", value: requests, icon: "📬", href: "#requests", color: requests > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Übersicht & Schnellzugriff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-xl p-5 flex flex-col gap-2 ${s.color} hover:opacity-80 transition`}>
            <span className="text-3xl">{s.icon}</span>
            <span className="text-3xl font-bold">{s.value}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Schnellaktionen</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/recipes/new" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
            + Neues Rezept
          </Link>
          <Link href="/admin/ingredients" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            + Zutat hinzufügen
          </Link>
          <Link href="/admin/weekplan" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            📅 Wochenplan
          </Link>
          <Link href="/admin/receipt-scan" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            🧾 Kassenbon scannen
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Available products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Verfügbare Produkte</h2>
          {availableProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine Produkte im Lager.</p>
          ) : (
            <ul className="space-y-2">
              {availableProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-gray-400">
                      {p.storageType === "FREEZER" ? "❄️" : "🧊"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{p.portionsRemaining} P.</span>
                    <span className="text-gray-400 ml-2">
                      MHD: {new Date(p.bestBefore).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/inventory" className="text-emerald-600 text-sm mt-3 block hover:underline">
            → Alle anzeigen
          </Link>
        </div>

        {/* Pending requests */}
        <div id="requests" className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Anfragen von Freunden
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine offenen Anfragen.</p>
          ) : (
            <ul className="space-y-2">
              {pendingRequests.map((r) => (
                <li key={r.id} className="text-sm border-l-4 border-amber-400 pl-3">
                  <span className="font-medium">{r.productName}</span>
                  {r.message && <span className="text-gray-400 ml-2">– {r.message}</span>}
                  <span className="text-gray-400 ml-2 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
