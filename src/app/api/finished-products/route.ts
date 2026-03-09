import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { PRICE_MARKUP } from "@/lib/pricing";

// GET all finished products (used by shop and admin)
export async function GET() {
  const products = await prisma.finishedProduct.findMany({
    where: { portionsRemaining: { gte: 0 } },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      },
    },
    orderBy: { bestBefore: "asc" },
  });
  return NextResponse.json(products);
}

// POST - cook a recipe and create finished product
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { recipeId, name, category, portionsTotal, storageType, bestBefore, freezerInstructions, vacuumInstructions } = await req.json();
  if (!recipeId || !name || !portionsTotal || !storageType || !bestBefore) {
    return NextResponse.json({ error: "Alle Felder sind Pflicht" }, { status: 400 });
  }

  // Calculate price
  const recipe = await prisma.recipe.findUnique({
    where: { id: Number(recipeId) },
    include: { ingredients: { include: { ingredient: true } } },
  });
  if (!recipe) return NextResponse.json({ error: "Rezept nicht gefunden" }, { status: 404 });

  const materialCost = recipe.ingredients.reduce(
    (sum, ri) => sum + ri.quantity * ri.ingredient.pricePerUnit,
    0
  );
  const pricePerPortion = (materialCost / Number(portionsTotal)) * PRICE_MARKUP;

  // Deduct stock
  for (const ri of recipe.ingredients) {
    await prisma.baseIngredient.update({
      where: { id: ri.ingredientId },
      data: { stockQuantity: { decrement: ri.quantity } },
    });
  }

  const product = await prisma.finishedProduct.create({
    data: {
      recipeId: Number(recipeId),
      name,
      category: category || null,
      portionsTotal: Number(portionsTotal),
      portionsRemaining: Number(portionsTotal),
      storageType,
      bestBefore: new Date(bestBefore),
      pricePerPortion,
      freezerInstructions: freezerInstructions || null,
      vacuumInstructions: vacuumInstructions || null,
    },
    include: { recipe: true },
  });
  return NextResponse.json(product, { status: 201 });
}
