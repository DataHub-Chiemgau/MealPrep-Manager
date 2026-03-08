import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingredient = await prisma.baseIngredient.findUnique({ where: { id: Number(id) } });
  if (!ingredient) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(ingredient);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await req.json();
  try {
    const ingredient = await prisma.baseIngredient.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        stockQuantity: data.stockQuantity,
      },
    });
    return NextResponse.json(ingredient);
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.baseIngredient.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 400 });
  }
}
