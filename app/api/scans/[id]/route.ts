import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get scan ID from params
    const { id } = await context.params;

    // Get scan with vulnerabilities
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        vulnerabilities: {
          orderBy: [
            { severity: "asc" }, // Orders by severity (critical first)
            { createdAt: "desc" },
          ],
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if (scan.userId !== payload.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Count vulnerabilities by severity
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

    return NextResponse.json({
      scan: {
        id: scan.id,
        target: scan.target,
        status: scan.status,
        scanType: scan.scanType,
        scanResults: scan.scanResults,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        vulnerabilities: scan.vulnerabilities,
        severityCounts,
        totalVulnerabilities: scan.vulnerabilities.length,
      },
    });
  } catch (error) {
    console.error("Get scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a scan
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get scan ID from params
    const { id } = await context.params;

    // Get scan to verify ownership
    const scan = await prisma.scan.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if (scan.userId !== payload.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete scan and related vulnerabilities (cascade)
    await prisma.scan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Scan deleted successfully",
    });
  } catch (error) {
    console.error("Delete scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}