import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { monitoringPreferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.monitoringPreferences || null);
  } catch (error) {
    console.error("Error fetching monitoring preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { enabled, frequency, notifyEmail, notifyOnNewVulns, notifyOnChanges } = body;

    // Calculate next scan time based on frequency
    let nextScanAt = null;
    if (enabled) {
      const now = new Date();
      switch (frequency) {
        case "DAILY":
          nextScanAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "WEEKLY":
          nextScanAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "MONTHLY":
          nextScanAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Update or create monitoring preferences
    const preferences = await prisma.monitoringPreference.upsert({
      where: { userId: user.id },
      update: {
        enabled,
        frequency,
        notifyEmail,
        notifyOnNewVulns,
        notifyOnChanges,
        nextScanAt,
      },
      create: {
        userId: user.id,
        enabled,
        frequency,
        notifyEmail,
        notifyOnNewVulns,
        notifyOnChanges,
        nextScanAt,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error saving monitoring preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}