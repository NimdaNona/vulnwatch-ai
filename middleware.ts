import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Add routes that require authentication
const protectedRoutes = ["/dashboard"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get("auth-token");

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Verify the token
      const payload = verifyToken(token.value);
      
      if (!payload) {
        // Invalid token, redirect to login
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Token is valid, allow the request to continue
      return NextResponse.next();
    } catch (error) {
      // Token verification failed
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // For non-protected routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};