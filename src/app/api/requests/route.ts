import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await prisma.productRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const { productName, message } = await req.json();
  if (!productName) return NextResponse.json({ error: "Produktname ist Pflicht" }, { status: 400 });
  const request = await prisma.productRequest.create({ data: { productName, message } });
  return NextResponse.json(request, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, handled } = await req.json();
  const request = await prisma.productRequest.update({
    where: { id: Number(id) },
    data: { handled },
  });
  return NextResponse.json(request);
}
