import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { environmentManager, getEnvironmentMode, isMockMode } from "./lib/config/environment";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const currentMode = getEnvironmentMode();
  
  // Skip authentication middleware when using mock data
  if (isMockMode()) {
    console.log(`🎭 Middleware: Mock mode (${currentMode}) - skipping auth checks for ${req.nextUrl.pathname}`);
    return res;
  }

  // Allow auth/fix and auth/debug pages to always work
  if (req.nextUrl.pathname === "/auth/fix" || req.nextUrl.pathname === "/auth/debug") {
    console.log(`🔧 Middleware: Allowing access to ${req.nextUrl.pathname}`);
    return res;
  }

  // Log environment mode for debugging (non-production only)
  if (currentMode !== 'production' && environmentManager.getConfig().ui.showDebugInfo) {
    console.log(`🚦 Middleware: ${currentMode} mode - processing auth for ${req.nextUrl.pathname}`);
  }

  // For local and production modes, use Supabase authentication
  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    console.log(`🔍 Middleware: Session check for ${req.nextUrl.pathname}:`, {
      hasSession: !!session,
      sessionId: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none',
      user: session?.user?.email || 'none',
      error: error?.message || 'none'
    });

    if (error) {
      console.error('🚨 Middleware: Supabase auth error:', error);
      // Don't redirect on auth errors, let the request through
      return res;
    }

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith("/dashboard") && !session) {
      console.log(`🔒 Middleware: Redirecting to auth - no session for ${req.nextUrl.pathname}`, {
        pathname: req.nextUrl.pathname,
        cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
      });
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Redirect authenticated users away from auth pages (except callback and debug pages)
    if (req.nextUrl.pathname.startsWith("/auth") && session && 
        !req.nextUrl.pathname.includes("/callback") && 
        !req.nextUrl.pathname.includes("/fix") && 
        !req.nextUrl.pathname.includes("/debug")) {
      console.log(`🔄 Middleware: Redirecting authenticated user to dashboard from ${req.nextUrl.pathname}`);
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res;
  } catch (error) {
    console.error('🚨 Middleware: Unexpected error:', error);
    // Let the request through on errors
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
