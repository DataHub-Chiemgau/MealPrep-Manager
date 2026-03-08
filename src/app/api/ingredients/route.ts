import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const ingredients = await prisma.baseIngredient.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(ingredients);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, unit, pricePerUnit, stockQuantity } = await req.json();
  if (!name || !unit) {
    return NextResponse.json({ error: "Name und Einheit sind Pflichtfelder" }, { status: 400 });
  }
  try {
    const ingredient = await prisma.baseIngredient.create({
      data: { name, unit, pricePerUnit: pricePerUnit ?? 0, stockQuantity: stockQuantity ?? 0 },
    });
    return NextResponse.json(ingredient, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Zutat existiert bereits" }, { status: 409 });
  }
}
