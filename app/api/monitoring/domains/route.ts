import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        monitoringPreferences: {
          include: {
            monitoredDomains: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      user.monitoringPreferences?.monitoredDomains || []
    );
  } catch (error) {
    console.error("Error fetching monitored domains:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
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
      include: { monitoringPreferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { domain } = await request.json();

    // Validate domain format
    const domainRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Ensure monitoring preferences exist
    let monitoringPreferenceId = user.monitoringPreferences?.id;
    if (!monitoringPreferenceId) {
      const prefs = await prisma.monitoringPreference.create({
        data: {
          userId: user.id,
          enabled: false,
        },
      });
      monitoringPreferenceId = prefs.id;
    }

    // Add domain
    const monitoredDomain = await prisma.monitoredDomain.create({
      data: {
        domain,
        monitoringPreferenceId,
      },
    });

    return NextResponse.json(monitoredDomain);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Domain already being monitored" },
        { status: 400 }
      );
    }
    console.error("Error adding monitored domain:", error);
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("id");

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        monitoringPreferences: {
          include: {
            monitoredDomains: true,
          },
        },
      },
    });

    if (!user || !user.monitoringPreferences) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify domain belongs to user
    const domain = user.monitoringPreferences.monitoredDomains.find(
      (d) => d.id === domainId
    );

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    await prisma.monitoredDomain.delete({
      where: { id: domainId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting monitored domain:", error);
    return NextResponse.json(
      { error: "Failed to delete domain" },
      { status: 500 }
    );
  }
}