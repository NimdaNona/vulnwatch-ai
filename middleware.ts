import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { checkRateLimit, getClientIp, applyRateLimitHeaders } from "@/lib/rate-limiter";

// Add routes that require authentication
const protectedRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Apply rate limiting to API routes
  if (path.startsWith("/api")) {
    // Skip rate limiting for auth endpoints and Stripe webhooks
    const skipPaths = ["/api/auth", "/api/stripe/webhook"];
    if (!skipPaths.some(skipPath => path.startsWith(skipPath))) {
      // Apply general API rate limiting based on IP
      const clientIp = getClientIp(request);
      const rateLimitResult = await checkRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
        identifier: clientIp,
        resource: "api",
      });

      if (!rateLimitResult.allowed) {
        const response = NextResponse.json(
          {
            error: "Too many requests",
            message: "Please slow down your requests",
            retryAfter: rateLimitResult.retryAfter,
          },
          { status: 429 }
        );
        applyRateLimitHeaders(response.headers, rateLimitResult);
        return response;
      }

      // Add rate limit headers to successful API responses
      const response = NextResponse.next();
      applyRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }
  }

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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    {
      source: "/(.*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};