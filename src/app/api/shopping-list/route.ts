import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

// GET shopping list for a week
export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  const items = await prisma.shoppingListItem.findMany({
    where: { weekStart },
    include: { ingredient: true },
    orderBy: { ingredient: { name: "asc" } },
  });
  return NextResponse.json(items);
}

// POST - generate shopping list from week plan
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { weekStart } = await req.json();
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });

  // Fetch all week plan entries with recipe ingredients
  const entries = await prisma.weekPlanEntry.findMany({
    where: { weekStart },
    include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
  });

  // Aggregate required quantities
  const needs = new Map<number, { ingredientId: number; required: number }>();
  for (const entry of entries) {
    for (const ri of entry.recipe.ingredients) {
      const curr = needs.get(ri.ingredientId) ?? { ingredientId: ri.ingredientId, required: 0 };
      curr.required += ri.quantity;
      needs.set(ri.ingredientId, curr);
    }
  }

  // Subtract current stock, keep only what's missing
  const ingredients = await prisma.baseIngredient.findMany({
    where: { id: { in: Array.from(needs.keys()) } },
  });
  const stockMap = new Map(ingredients.map((i) => [i.id, i.stockQuantity]));

  const missing: { ingredientId: number; requiredQuantity: number }[] = [];
  for (const [ingredientId, { required }] of needs) {
    const stock = stockMap.get(ingredientId) ?? 0;
    const diff = required - stock;
    if (diff > 0) missing.push({ ingredientId, requiredQuantity: diff });
  }

  // Delete existing list for this week and recreate
  await prisma.shoppingListItem.deleteMany({ where: { weekStart } });
  if (missing.length > 0) {
    await prisma.shoppingListItem.createMany({
      data: missing.map((m) => ({ ...m, weekStart })),
    });
  }

  const items = await prisma.shoppingListItem.findMany({
    where: { weekStart },
    include: { ingredient: true },
  });
  return NextResponse.json(items, { status: 201 });
}

// PATCH - toggle checkedOff on item
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, checkedOff } = await req.json();
  const item = await prisma.shoppingListItem.update({
    where: { id: Number(id) },
    data: { checkedOff },
    include: { ingredient: true },
  });
  return NextResponse.json(item);
}
