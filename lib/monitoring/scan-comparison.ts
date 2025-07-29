import { Vulnerability, Scan, Prisma } from "@prisma/client";

export interface ScanComparison {
  newVulnerabilities: Vulnerability[];
  resolvedVulnerabilities: Vulnerability[];
  changedVulnerabilities: {
    previous: Vulnerability;
    current: Vulnerability;
    changes: string[];
  }[];
  securityScoreDelta: number;
  summary: {
    totalNew: number;
    totalResolved: number;
    totalChanged: number;
    criticalNew: number;
    highNew: number;
    overallStatus: "improved" | "degraded" | "unchanged";
  };
}

// Calculate security score based on vulnerabilities
export function calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 100;

  let score = 100;
  const weights = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 5,
    LOW: 2,
  };

  vulnerabilities.forEach(vuln => {
    const severity = vuln.severity as keyof typeof weights;
    score -= weights[severity] || 0;
  });

  return Math.max(0, score);
}

// Compare two scans and identify changes
export async function compareScanResults(
  previousScan: Scan & { vulnerabilities: Vulnerability[] },
  currentScan: Scan & { vulnerabilities: Vulnerability[] }
): Promise<ScanComparison> {
  const previousVulns = previousScan.vulnerabilities;
  const currentVulns = currentScan.vulnerabilities;

  // Create maps for easier comparison
  const previousMap = new Map<string, Vulnerability>();
  const currentMap = new Map<string, Vulnerability>();

  // Use a combination of title and affected as key
  previousVulns.forEach(vuln => {
    const key = `${vuln.title}:${vuln.affected || 'general'}`;
    previousMap.set(key, vuln);
  });

  currentVulns.forEach(vuln => {
    const key = `${vuln.title}:${vuln.affected || 'general'}`;
    currentMap.set(key, vuln);
  });

  // Find new vulnerabilities
  const newVulnerabilities: Vulnerability[] = [];
  currentVulns.forEach(vuln => {
    const key = `${vuln.title}:${vuln.affected || 'general'}`;
    if (!previousMap.has(key)) {
      newVulnerabilities.push(vuln);
    }
  });

  // Find resolved vulnerabilities
  const resolvedVulnerabilities: Vulnerability[] = [];
  previousVulns.forEach(vuln => {
    const key = `${vuln.title}:${vuln.affected || 'general'}`;
    if (!currentMap.has(key)) {
      resolvedVulnerabilities.push(vuln);
    }
  });

  // Find changed vulnerabilities
  const changedVulnerabilities: ScanComparison['changedVulnerabilities'] = [];
  currentVulns.forEach(currentVuln => {
    const key = `${currentVuln.title}:${currentVuln.affected || 'general'}`;
    const previousVuln = previousMap.get(key);
    
    if (previousVuln) {
      const changes: string[] = [];
      
      // Check for severity changes
      if (previousVuln.severity !== currentVuln.severity) {
        changes.push(`Severity changed from ${previousVuln.severity} to ${currentVuln.severity}`);
      }
      
      // Check for CVSS score changes
      if (previousVuln.cvss !== currentVuln.cvss) {
        changes.push(`CVSS score changed from ${previousVuln.cvss || 'N/A'} to ${currentVuln.cvss || 'N/A'}`);
      }
      
      // Check for description changes
      if (previousVuln.description !== currentVuln.description) {
        changes.push("Description updated");
      }
      
      if (changes.length > 0) {
        changedVulnerabilities.push({
          previous: previousVuln,
          current: currentVuln,
          changes,
        });
      }
    }
  });

  // Calculate security scores
  const previousScore = calculateSecurityScore(previousVulns);
  const currentScore = calculateSecurityScore(currentVulns);
  const securityScoreDelta = currentScore - previousScore;

  // Count new vulnerabilities by severity
  const criticalNew = newVulnerabilities.filter(v => v.severity === "CRITICAL").length;
  const highNew = newVulnerabilities.filter(v => v.severity === "HIGH").length;

  // Determine overall status
  let overallStatus: "improved" | "degraded" | "unchanged" = "unchanged";
  if (securityScoreDelta > 0) {
    overallStatus = "improved";
  } else if (securityScoreDelta < 0) {
    overallStatus = "degraded";
  }

  return {
    newVulnerabilities,
    resolvedVulnerabilities,
    changedVulnerabilities,
    securityScoreDelta,
    summary: {
      totalNew: newVulnerabilities.length,
      totalResolved: resolvedVulnerabilities.length,
      totalChanged: changedVulnerabilities.length,
      criticalNew,
      highNew,
      overallStatus,
    },
  };
}

// Generate a human-readable summary of changes
export function generateComparisonSummary(comparison: ScanComparison): string {
  const { summary } = comparison;
  const parts: string[] = [];

  if (summary.totalNew > 0) {
    parts.push(`🚨 ${summary.totalNew} new vulnerabilities found`);
    if (summary.criticalNew > 0) {
      parts.push(`(${summary.criticalNew} critical)`);
    }
    if (summary.highNew > 0) {
      parts.push(`(${summary.highNew} high)`);
    }
  }

  if (summary.totalResolved > 0) {
    parts.push(`✅ ${summary.totalResolved} vulnerabilities resolved`);
  }

  if (summary.totalChanged > 0) {
    parts.push(`📝 ${summary.totalChanged} vulnerabilities changed`);
  }

  if (comparison.securityScoreDelta !== 0) {
    const direction = comparison.securityScoreDelta > 0 ? "improved" : "decreased";
    const emoji = comparison.securityScoreDelta > 0 ? "📈" : "📉";
    parts.push(`${emoji} Security score ${direction} by ${Math.abs(comparison.securityScoreDelta)} points`);
  }

  return parts.join(" | ");
}