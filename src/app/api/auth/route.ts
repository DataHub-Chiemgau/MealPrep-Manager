import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, getAdminSessionToken, checkShopPin, getShopSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { type, password, pin } = await req.json();

  if (type === "admin") {
    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("mealprep_admin", getAdminSessionToken(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  }

  if (type === "shop") {
    if (!checkShopPin(pin)) {
      return NextResponse.json({ error: "Falsche PIN" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("mealprep_shop", getShopSessionToken(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const { type } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (type === "admin") res.cookies.delete("mealprep_admin");
  if (type === "shop") res.cookies.delete("mealprep_shop");
  return res;
}
