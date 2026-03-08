import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: Number(id) },
    include: { ingredients: { include: { ingredient: true } } },
  });
  if (!recipe) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { name, description, servings, instructions, ingredients } = await req.json();
  // Delete existing ingredients and recreate
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: Number(id) } });
  const recipe = await prisma.recipe.update({
    where: { id: Number(id) },
    data: {
      name,
      description,
      servings: Number(servings),
      instructions,
      ingredients: {
        create: (ingredients ?? []).map((i: { ingredientId: number; quantity: number }) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
        })),
      },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });
  return NextResponse.json(recipe);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.recipe.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 400 });
  }
}
