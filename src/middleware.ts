import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "ht_admin_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const [tsStr, hex] = token.split(".");
  if (!tsStr || !hex) return false;

  const timestamp = Number(tsStr);
  if (isNaN(timestamp) || Date.now() - timestamp > MAX_AGE_MS) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(String(timestamp)));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (except login page and API auth)
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value || !(await verifyToken(cookie.value))) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
