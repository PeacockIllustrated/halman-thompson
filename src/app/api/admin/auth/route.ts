import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function createToken(timestamp: number): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(String(timestamp)));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${timestamp}.${hex}`;
}

/** Constant-time string comparison — avoids leaking the password via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i++) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  // Brute-force protection: cap login attempts per client IP.
  const limit = rateLimit(`admin-login:${clientKey(req)}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      }
    );
  }

  let password: unknown;
  try {
    const body = await req.json();
    password = (body as { password?: unknown } | null)?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof password !== "string" || !timingSafeEqual(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createToken(Date.now());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
