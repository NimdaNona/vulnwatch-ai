import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// This cron job runs every hour to check for scheduled scans
export async function GET(request: NextRequest) {
  try {
    // Verify this is from Vercel Cron (check for authorization header)
    const authHeader = headers().get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find all monitoring preferences that are enabled and due for scanning
    const dueMonitoring = await prisma.monitoringPreference.findMany({
      where: {
        enabled: true,
        nextScanAt: {
          lte: now,
        },
      },
      include: {
        user: true,
        monitoredDomains: true,
      },
    });

    console.log(`Found ${dueMonitoring.length} users due for monitoring scans`);

    const results = [];

    for (const monitoring of dueMonitoring) {
      try {
        // Skip if no domains to monitor
        if (monitoring.monitoredDomains.length === 0) {
          continue;
        }

        // Calculate next scan time
        let nextScanAt = new Date(now);
        switch (monitoring.frequency) {
          case "DAILY":
            nextScanAt.setDate(nextScanAt.getDate() + 1);
            break;
          case "WEEKLY":
            nextScanAt.setDate(nextScanAt.getDate() + 7);
            break;
          case "MONTHLY":
            nextScanAt.setMonth(nextScanAt.getMonth() + 1);
            break;
        }

        // Update monitoring record
        await prisma.monitoringPreference.update({
          where: { id: monitoring.id },
          data: {
            lastScanAt: now,
            nextScanAt,
          },
        });

        // Create scans for each monitored domain
        for (const domain of monitoring.monitoredDomains) {
          try {
            // Create scan record
            const scan = await prisma.scan.create({
              data: {
                userId: monitoring.userId,
                targetUrl: domain.domain,
                status: "pending",
              },
            });

            // Here you would trigger the actual scan
            // For now, we'll just log it
            console.log(`Created scan ${scan.id} for domain ${domain.domain}`);

            // Update last scan ID
            await prisma.monitoredDomain.update({
              where: { id: domain.id },
              data: { lastScanId: scan.id },
            });

            results.push({
              userId: monitoring.userId,
              domain: domain.domain,
              scanId: scan.id,
            });

            // TODO: Trigger actual scan via backend API
            // TODO: Send notification emails if enabled
          } catch (error) {
            console.error(`Failed to create scan for domain ${domain.domain}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to process monitoring for user ${monitoring.userId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Monitoring cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}