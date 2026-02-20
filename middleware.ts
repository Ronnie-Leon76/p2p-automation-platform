import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getBackendAdapter(): "mock" | "supabase" | "postgres" {
  const configured =
    (process.env.NEXT_PUBLIC_BACKEND_ADAPTER ?? process.env.BACKEND_ADAPTER ?? "supabase").toLowerCase();
  if (configured === "mock" || configured === "supabase" || configured === "postgres") {
    return configured;
  }
  return "supabase";
}

function isMockModeFromEnv() {
  return (
    process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    getBackendAdapter() === "mock"
  );
}

function hasAuthSessionCookie(req: NextRequest, adapter: "mock" | "supabase" | "postgres") {
  const cookieNames = req.cookies.getAll().map((cookie) => cookie.name);

  if (adapter === "postgres") {
    return cookieNames.some(
      (name) => name.includes("better-auth") || name === "session_token" || name.includes("session-token"),
    );
  }

  return cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip authentication middleware when using mock data
  if (isMockModeFromEnv()) {
    return res;
  }

  // Allow auth/fix and auth/debug pages to always work
  if (req.nextUrl.pathname === "/auth/fix" || req.nextUrl.pathname === "/auth/debug") {
    return res;
  }

  const adapter = getBackendAdapter();
  const isAuthenticated = hasAuthSessionCookie(req, adapter);

  try {
    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith("/dashboard") && !isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Redirect authenticated users away from auth pages (except callback and debug pages)
    if (req.nextUrl.pathname.startsWith("/auth") && isAuthenticated && 
        !req.nextUrl.pathname.includes("/callback") && 
        !req.nextUrl.pathname.includes("/fix") && 
        !req.nextUrl.pathname.includes("/debug")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res;
  } catch (error) {
    // Let the request through on errors
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
