import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerAuthPort } from "./lib/composition/auth-composer";
import { isMockMode } from "./lib/config/environment";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip authentication middleware when using mock data
  if (isMockMode()) {
    return res;
  }

  // Allow auth/fix and auth/debug pages to always work
  if (req.nextUrl.pathname === "/auth/fix" || req.nextUrl.pathname === "/auth/debug") {
    return res;
  }

  // For local and production modes, use Supabase authentication
  try {
    const authPort = getServerAuthPort();
    const user = await authPort.getCurrentUser();

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith("/dashboard") && !user) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Redirect authenticated users away from auth pages (except callback and debug pages)
    if (req.nextUrl.pathname.startsWith("/auth") && user && 
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
