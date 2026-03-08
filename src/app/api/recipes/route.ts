import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, description, servings, instructions, ingredients } = await req.json();
  if (!name || !servings) {
    return NextResponse.json({ error: "Name und Portionen sind Pflichtfelder" }, { status: 400 });
  }
  const recipe = await prisma.recipe.create({
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
  return NextResponse.json(recipe, { status: 201 });
}
