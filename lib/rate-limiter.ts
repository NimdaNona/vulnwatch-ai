import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  identifier: string;  // User ID or IP address
  resource: string;  // Resource being limited (e.g., "scan", "api")
}

// In-memory store for rate limit data (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { windowMs, maxRequests, identifier, resource } = config;
  const key = `${resource}:${identifier}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  // Get current rate limit data
  let data = rateLimitStore.get(key);

  if (!data || data.resetTime < now) {
    // Create new window
    data = { count: 1, resetTime };
    rateLimitStore.set(key, data);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.floor(resetTime / 1000),
    };
  }

  // Check if limit exceeded
  if (data.count >= maxRequests) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.floor(data.resetTime / 1000),
      retryAfter,
    };
  }

  // Increment counter
  data.count++;
  rateLimitStore.set(key, data);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - data.count,
    reset: Math.floor(data.resetTime / 1000),
  };
}

// Database-backed rate limiting for persistent limits
export async function checkDatabaseRateLimit(
  userId: string,
  resource: string,
  dailyLimit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count requests for today
  const count = await prisma.scan.count({
    where: {
      userId,
      createdAt: {
        gte: today,
      },
    },
  });

  return {
    allowed: count < dailyLimit,
    used: count,
    limit: dailyLimit,
  };
}

// Get plan-based limits
export function getPlanLimits(plan: string | null) {
  switch (plan) {
    case "pro":
      return {
        scansPerHour: 10,
        scansPerDay: 100,
        scansPerMonth: 2000,
      };
    case "starter":
      return {
        scansPerHour: 3,
        scansPerDay: 20,
        scansPerMonth: 300,
      };
    default:
      // Free tier or no plan
      return {
        scansPerHour: 1,
        scansPerDay: 5,
        scansPerMonth: 50,
      };
  }
}

// Extract IP address from request
export function getClientIp(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default
  return "unknown";
}

// Apply rate limit headers to response
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
) {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());
  
  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
}