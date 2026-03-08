import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const SHOP_PIN = process.env.SHOP_PIN ?? "1234";

const ADMIN_SESSION_TOKEN = createHash("sha256")
  .update(`admin:${ADMIN_PASSWORD}`)
  .digest("hex");
const SHOP_SESSION_TOKEN = createHash("sha256")
  .update(`shop:${SHOP_PIN}`)
  .digest("hex");

function safeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes (not login page or API)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminCookie = req.cookies.get("mealprep_admin")?.value ?? "";
    if (!safeEqual(adminCookie, ADMIN_SESSION_TOKEN)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect shop routes (not login page)
  if (pathname.startsWith("/shop") && !pathname.startsWith("/shop/login")) {
    const shopCookie = req.cookies.get("mealprep_shop")?.value ?? "";
    if (!safeEqual(shopCookie, SHOP_SESSION_TOKEN)) {
      return NextResponse.redirect(new URL("/shop/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/shop/:path*"],
};
