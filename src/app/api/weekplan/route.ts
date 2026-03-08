import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

// GET /api/weekplan?weekStart=2024-01-01
export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  const entries = await prisma.weekPlanEntry.findMany({
    where: { weekStart },
    include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { mealSlot: "asc" }],
  });
  return NextResponse.json(entries);
}

// POST /api/weekplan  - add or replace entry
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { weekStart, dayOfWeek, mealSlot, recipeId } = await req.json();
  // Remove existing same slot
  await prisma.weekPlanEntry.deleteMany({ where: { weekStart, dayOfWeek, mealSlot } });
  if (!recipeId) return NextResponse.json({ ok: true });
  const entry = await prisma.weekPlanEntry.create({
    data: { weekStart, dayOfWeek: Number(dayOfWeek), mealSlot, recipeId: Number(recipeId) },
    include: { recipe: true },
  });
  return NextResponse.json(entry, { status: 201 });
}

// DELETE /api/weekplan?id=1
export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.weekPlanEntry.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
