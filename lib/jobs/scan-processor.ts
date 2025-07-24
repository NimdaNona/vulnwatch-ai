import { prisma } from "@/lib/prisma";
import { runComprehensiveScan } from "@/lib/scanner/scanner";
import { sendScanNotificationEmail } from "@/lib/email";

export async function processScan(scanId: string) {
  console.log(`Processing scan: ${scanId}`);
  
  try {
    // Get scan details
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }

    // Update scan status to running
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "running" },
    });

    // Perform the actual scan
    // Note: scan.target is undefined - using targetUrl instead
    const target = (scan as any).target || scan.targetUrl;
    const scanResult = await runComprehensiveScan(target);

    // Save vulnerabilities to database
    const vulnerabilities = await Promise.all(
      scanResult.vulnerabilities.map(vuln =>
        prisma.vulnerability.create({
          data: {
            scanId: scan.id,
            title: vuln.title,
            severity: vuln.severity.toUpperCase(),
            description: vuln.description,
            solution: vuln.remediation,
            affected: vuln.service ? `${vuln.service}${vuln.port ? `:${vuln.port}` : ''}` : undefined,
            cvss: vuln.cvssScore,
            cve: vuln.cveIds && vuln.cveIds.length > 0 ? vuln.cveIds[0] : undefined,
            aiAnalysis: vuln.cvssScore ? {
              cvssScore: vuln.cvssScore,
              cveIds: vuln.cveIds || [],
              severity: vuln.severity,
            } : undefined,
          },
        })
      )
    );

    // Update scan with results
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "completed",
        completedAt: new Date(),
        results: JSON.parse(JSON.stringify({
          ipAddress: scanResult.ipAddress,
          openPorts: scanResult.openPorts,
          services: scanResult.services,
          osFingerprint: scanResult.osFingerprint,
          scanDuration: scanResult.scanDuration,
          sslCertificate: scanResult.sslCertificate,
          subdomains: scanResult.subdomains,
        })),
      },
    });

    // Count vulnerabilities by severity
    const severityCounts = {
      critical: vulnerabilities.filter(v => v.severity === "CRITICAL").length,
      high: vulnerabilities.filter(v => v.severity === "HIGH").length,
      medium: vulnerabilities.filter(v => v.severity === "MEDIUM").length,
      low: vulnerabilities.filter(v => v.severity === "LOW").length,
    };

    // Send notification email
    try {
      await sendScanNotificationEmail(
        scan.user.email,
        scan.user.name,
        {
          domain: target,
          vulnerabilitiesFound: vulnerabilities.length,
          criticalCount: severityCounts.critical,
          highCount: severityCounts.high,
          mediumCount: severityCounts.medium,
          lowCount: severityCounts.low,
          scanId: scan.id,
        }
      );
    } catch (emailError) {
      console.error("Failed to send scan notification email:", emailError);
      // Don't fail the scan if email fails
    }

    console.log(`Scan completed: ${scanId}, found ${vulnerabilities.length} vulnerabilities`);
    
    return {
      success: true,
      vulnerabilitiesFound: vulnerabilities.length,
      severityCounts,
    };
  } catch (error) {
    console.error(`Scan processing error for ${scanId}:`, error);
    
    // Update scan status to failed
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

// Background job to clean up old scans
export async function cleanupOldScans() {
  try {
    // Delete scans older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await prisma.scan.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old scans`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old scans:", error);
    throw error;
  }
}

// Check for stuck scans and mark them as failed
export async function checkStuckScans() {
  try {
    // Find scans that have been running for more than 30 minutes
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);

    const stuckScans = await prisma.scan.updateMany({
      where: {
        status: "running",
        createdAt: {
          lt: cutoffTime,
        },
      },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });

    if (stuckScans.count > 0) {
      console.log(`Marked ${stuckScans.count} stuck scans as failed`);
    }

    return stuckScans.count;
  } catch (error) {
    console.error("Error checking stuck scans:", error);
    throw error;
  }
}