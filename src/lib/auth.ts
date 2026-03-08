import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { timingSafeEqual, randomBytes, createHash } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const SHOP_PIN = process.env.SHOP_PIN ?? "1234";

/** A stable, non-secret token derived from the secret — used as cookie value */
const ADMIN_SESSION_TOKEN = createHash("sha256")
  .update(`admin:${ADMIN_PASSWORD}`)
  .digest("hex");
const SHOP_SESSION_TOKEN = createHash("sha256")
  .update(`shop:${SHOP_PIN}`)
  .digest("hex");

const ADMIN_SESSION_COOKIE = "mealprep_admin";
const SHOP_SESSION_COOKIE = "mealprep_shop";

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

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  return safeEqual(value, ADMIN_SESSION_TOKEN);
}

export async function isShopAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SHOP_SESSION_COOKIE)?.value ?? "";
  return safeEqual(value, SHOP_SESSION_TOKEN);
}

export function checkAdminPassword(password: string): boolean {
  return safeEqual(password, ADMIN_PASSWORD);
}

export function checkShopPin(pin: string): boolean {
  return safeEqual(pin, SHOP_PIN);
}

export function getAdminSessionToken(): string {
  return ADMIN_SESSION_TOKEN;
}

export function getShopSessionToken(): string {
  return SHOP_SESSION_TOKEN;
}
