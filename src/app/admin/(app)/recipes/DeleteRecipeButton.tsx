"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRecipeButton({ id, name }: { id: number; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Rezept "${name}" wirklich löschen?`)) return;
    setLoading(true);
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 text-sm bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg disabled:opacity-50"
    >
      {loading ? "..." : "Löschen"}
    </button>
  );
}
