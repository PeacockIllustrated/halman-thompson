// ─── HT Fabrication Visualiser — Admin Auth ─────────────────────
// Shared admin-session verification, used by BOTH the middleware and the
// admin API routes (defence in depth). The session token has the form
// "<timestamp>.<hex>" where hex = HMAC-SHA256(String(timestamp)) keyed by
// ADMIN_PASSWORD, and is valid for 7 days.

import { NextResponse, type NextRequest } from "next/server";

export const ADMIN_COOKIE = "ht_admin_session";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Constant-time comparison of two hex signature strings. Avoids leaking
 * where two signatures diverge via early-exit timing (unlike `===`).
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Verify an admin session token's signature and expiry. */
export async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const [tsStr, hex] = token.split(".");
  if (!tsStr || !hex) return false;

  const timestamp = Number(tsStr);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_MS) {
    return false;
  }

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

  return timingSafeEqualHex(hex, expected);
}

/**
 * Guard for admin API route handlers. Returns a 401 NextResponse when the
 * request lacks a valid admin session cookie, or null when authorised.
 * Call at the top of every protected admin route (belt-and-braces with the
 * middleware matcher).
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
