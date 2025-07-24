import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {
      userId: payload.userId,
    };

    if (status) {
      where.status = status;
    }

    // Get scans with vulnerability counts
    const scans = await prisma.scan.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            vulnerabilities: true,
          },
        },
        vulnerabilities: {
          select: {
            severity: true,
          },
        },
      },
    });

    // Transform scans to include severity counts
    const transformedScans = scans.map(scan => {
      const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      scan.vulnerabilities.forEach(vuln => {
        const severity = vuln.severity.toLowerCase() as keyof typeof severityCounts;
        if (severity in severityCounts) {
          severityCounts[severity]++;
        }
      });

      return {
        id: scan.id,
        target: scan.targetUrl,
        status: scan.status,
        scanType: "full",
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        totalVulnerabilities: scan._count.vulnerabilities,
        severityCounts,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.scan.count({ where });

    return NextResponse.json({
      scans: transformedScans,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("List scans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}