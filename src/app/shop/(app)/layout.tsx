"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "shop" }),
    });
    router.push("/shop/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/shop" className="font-bold text-lg">🛒 MealPrep Shop</Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full"
          >
            Abmelden
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
