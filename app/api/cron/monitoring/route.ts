import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { processScan } from "@/lib/jobs/scan-processor";
import { compareScanResults, generateComparisonSummary } from "@/lib/monitoring/scan-comparison";
import { sendMonitoringAlertEmail } from "@/lib/email";
import { config } from "@/lib/config";

// This cron job runs every hour to check for scheduled scans
export async function GET(request: NextRequest) {
  try {
    // Verify this is from Vercel Cron (check for authorization header)
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader !== `Bearer ${config.CRON_SECRET}`) {
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
        monitoredDomains: {
          include: {
            lastScan: {
              include: {
                vulnerabilities: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${dueMonitoring.length} users due for monitoring scans`);

    const results = [];
    const scanPromises: Promise<void>[] = [];

    for (const monitoring of dueMonitoring) {
      try {
        // Skip if no domains to monitor
        if (monitoring.monitoredDomains.length === 0) {
          continue;
        }

        // Calculate next scan time
        const nextScanAt = new Date(now);
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
                results: { scanType: "quick" }, // Use quick scan for monitoring
              },
            });

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

            // Process scan asynchronously
            const scanPromise = processScan(scan.id).then(async () => {
              // After scan completes, check for changes
              if (domain.lastScan) {
                try {
                  // Get the completed scan with vulnerabilities
                  const completedScan = await prisma.scan.findUnique({
                    where: { id: scan.id },
                    include: { vulnerabilities: true },
                  });

                  if (completedScan && domain.lastScan) {
                    // Compare scans
                    const comparison = await compareScanResults(
                      domain.lastScan as any,
                      completedScan as any
                    );

                    // Check if we should send notifications
                    if (monitoring.notifyEmail) {
                      const shouldNotify = 
                        (monitoring.notifyOnNewVulns && comparison.summary.totalNew > 0) ||
                        (monitoring.notifyOnChanges && (
                          comparison.summary.totalChanged > 0 || 
                          comparison.summary.totalResolved > 0
                        ));

                      if (shouldNotify) {
                        // Send alert email
                        await sendMonitoringAlertEmail(
                          monitoring.user.email,
                          monitoring.user.name || "User",
                          {
                            domain: domain.domain,
                            comparison,
                            scanId: scan.id,
                            summary: generateComparisonSummary(comparison),
                          }
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Failed to compare scans for domain ${domain.domain}:`, error);
                }
              }
            }).catch(error => {
              console.error(`Failed to process scan ${scan.id}:`, error);
            });

            scanPromises.push(scanPromise);
          } catch (error) {
            console.error(`Failed to create scan for domain ${domain.domain}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to process monitoring for user ${monitoring.userId}:`, error);
      }
    }

    // Wait for all scans to start processing (but don't wait for completion)
    // This ensures scans are queued but allows the cron job to complete quickly
    Promise.all(scanPromises).catch(error => {
      console.error("Some scans failed to process:", error);
    });

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