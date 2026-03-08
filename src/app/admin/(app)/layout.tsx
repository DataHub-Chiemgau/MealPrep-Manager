"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/recipes", label: "Rezepte", icon: "📖" },
  { href: "/admin/ingredients", label: "Zutaten", icon: "🥗" },
  { href: "/admin/weekplan", label: "Wochenplan", icon: "📅" },
  { href: "/admin/inventory", label: "Lager", icon: "📦" },
  { href: "/admin/receipt-scan", label: "Bon-Scan", icon: "🧾" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "admin" }),
    });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-emerald-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-2xl"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰
            </button>
            <span className="font-bold text-lg">🥦 MealPrep Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">
              🛒 Shop
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav
          className={`${
            menuOpen ? "block" : "hidden"
          } md:block w-full md:w-56 bg-white border-r border-gray-200 shadow-sm md:min-h-screen`}
        >
          <ul className="py-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
