import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyToken } from "@/lib/auth";
import { z } from "zod";
import { 
  checkRateLimit, 
  checkDatabaseRateLimit, 
  getPlanLimits, 
  applyRateLimitHeaders 
} from "@/lib/rate-limiter";

// Request validation schema
const createScanSchema = z.object({
  domain: z.string().url("Invalid domain URL"),
  scanType: z.enum(["quick", "full", "web"]).default("full"),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user and verify subscription
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check subscription status
    if (!user.subscriptionStatus || user.subscriptionStatus === "canceled") {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 }
      );
    }

    // Get plan limits
    const planLimits = getPlanLimits(user.subscriptionPlan);

    // Check hourly rate limit
    const hourlyRateLimit = await checkRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: planLimits.scansPerHour,
      identifier: user.id,
      resource: "scan",
    });

    if (!hourlyRateLimit.allowed) {
      const response = NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          message: `You have reached your hourly scan limit of ${planLimits.scansPerHour} scans. Please try again later.`,
          retryAfter: hourlyRateLimit.retryAfter 
        },
        { status: 429 }
      );
      applyRateLimitHeaders(response.headers, hourlyRateLimit);
      return response;
    }

    // Check daily rate limit
    const dailyRateLimit = await checkDatabaseRateLimit(
      user.id,
      "scan",
      planLimits.scansPerDay
    );

    if (!dailyRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Daily limit exceeded", 
          message: `You have reached your daily scan limit of ${planLimits.scansPerDay} scans. Your limit resets at midnight.`,
          used: dailyRateLimit.used,
          limit: dailyRateLimit.limit
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createScanSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { domain, scanType } = validationResult.data;

    // Extract hostname from URL
    const url = new URL(domain);
    const target = url.hostname;

    // Check for existing scan in progress
    const existingScan = await prisma.scan.findFirst({
      where: {
        userId: user.id,
        targetUrl: target,
        status: "running",
      },
    });

    if (existingScan) {
      return NextResponse.json(
        { error: "A scan is already in progress for this domain" },
        { status: 409 }
      );
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        userId: user.id,
        targetUrl: target,
        status: "pending",
      },
    });

    // Queue the scan for processing
    // In production, this would queue to Redis/BullMQ
    // For now, we'll simulate async processing
    setTimeout(async () => {
      try {
        const { processScan } = await import("@/lib/jobs/scan-processor");
        await processScan(scan.id);
      } catch (error) {
        console.error("Failed to process scan:", error);
        // Update scan status to failed
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: "failed",
            completedAt: new Date(),
          },
        });
      }
    }, 1000);

    const response = NextResponse.json({
      scan: {
        id: scan.id,
        target: scan.targetUrl,
        status: scan.status,
        scanType: scanType,
        createdAt: scan.createdAt,
      },
      message: "Scan queued successfully",
      limits: {
        hourly: {
          used: planLimits.scansPerHour - hourlyRateLimit.remaining,
          limit: planLimits.scansPerHour,
          remaining: hourlyRateLimit.remaining,
        },
        daily: {
          used: dailyRateLimit.used + 1,
          limit: dailyRateLimit.limit,
          remaining: dailyRateLimit.limit - dailyRateLimit.used - 1,
        },
      },
    });

    // Add rate limit headers
    applyRateLimitHeaders(response.headers, hourlyRateLimit);
    
    return response;
  } catch (error) {
    console.error("Create scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}