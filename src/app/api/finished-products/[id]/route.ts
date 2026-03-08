import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

// GET single finished product
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.finishedProduct.findUnique({
    where: { id: Number(id) },
    include: { recipe: true },
  });
  if (!product) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(product);
}

// POST /api/finished-products/[id] - purchase portions (shop)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quantity } = await req.json();
  const qty = Number(quantity) || 1;

  const product = await prisma.finishedProduct.findUnique({ where: { id: Number(id) } });
  if (!product) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (product.portionsRemaining < qty) {
    return NextResponse.json({ error: "Nicht genug Portionen verfügbar" }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.finishedProduct.update({
      where: { id: Number(id) },
      data: { portionsRemaining: { decrement: qty } },
    }),
    prisma.purchaseItem.create({
      data: {
        finishedProductId: Number(id),
        quantity: qty,
        totalPrice: qty * product.pricePerPortion,
      },
    }),
  ]);
  return NextResponse.json(updated);
}

// DELETE - admin only
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.finishedProduct.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
