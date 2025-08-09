import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware in development mode to allow mock authentication
  if (process.env.NODE_ENV === "development") {
    console.log(`🚦 Middleware: Development mode - skipping auth checks for ${req.nextUrl.pathname}`);
    return res;
  }

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/auth", req.url))
  }

  // Redirect authenticated users away from auth pages
  if (req.nextUrl.pathname.startsWith("/auth") && session && !req.nextUrl.pathname.includes("/callback")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
