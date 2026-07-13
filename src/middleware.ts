import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");

  // Allow-list (no auth required): the login page and the auth API (login +
  // logout). `/api/admin/auth` covers `/api/admin/auth` and its subpaths.
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const authed = token ? await verifyAdminToken(token) : false;
  if (authed) return NextResponse.next();

  // Unauthenticated: API routes get a 401 JSON (never a redirect), pages get
  // bounced to the login screen.
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
