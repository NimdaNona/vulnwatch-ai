import { PortInfo, ServiceInfo, Vulnerability } from "./scanner";

interface AnalysisInput {
  domain: string;
  openPorts: PortInfo[];
  services: ServiceInfo[];
  osFingerprint?: string;
}

interface AnalysisResult {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  summary: string;
  recommendations: string[];
}

// Mock AI analysis for now - in production, integrate with OpenAI
export async function analyzeThreats(input: AnalysisInput): Promise<AnalysisResult> {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Analyze based on open ports and services
  const analysis = analyzeServicesAndPorts(input);
  vulnerabilities.push(...analysis.vulnerabilities);
  recommendations.push(...analysis.recommendations);
  riskScore = analysis.riskScore;

  // OS-specific vulnerabilities
  if (input.osFingerprint) {
    const osAnalysis = analyzeOS(input.osFingerprint);
    vulnerabilities.push(...osAnalysis.vulnerabilities);
    recommendations.push(...osAnalysis.recommendations);
    riskScore = Math.max(riskScore, osAnalysis.riskScore);
  }

  // Generate summary
  const summary = generateSummary(input, vulnerabilities, riskScore);

  return {
    vulnerabilities,
    riskScore,
    summary,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

function analyzeServicesAndPorts(input: AnalysisInput): {
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  riskScore: number;
} {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Check for database services exposed
  const dbServices = ["mysql", "postgresql", "mongodb", "redis", "memcached"];
  const exposedDbs = input.services.filter(s => dbServices.includes(s.name.toLowerCase()));
  
  if (exposedDbs.length > 0) {
    for (const db of exposedDbs) {
      vulnerabilities.push({
        id: `ai-db-exposed-${db.name}`,
        title: `${db.name} Database Exposed to Internet`,
        severity: "critical",
        description: `${db.name} database service is directly accessible from the internet on port ${db.port}. This is a severe security risk.`,
        port: db.port,
        service: db.name,
        remediation: `Immediately restrict access to ${db.name} using firewall rules. Database services should never be directly exposed to the internet.`,
        cvssScore: 9.5,
      });
      riskScore = Math.max(riskScore, 90);
    }
    recommendations.push("Implement network segmentation and place all database services behind a firewall");
    recommendations.push("Use VPN or SSH tunneling for remote database access");
  }

  // Check for development/debug services
  const debugServices = ["docker", "kubernetes", "jenkins", "gitlab"];
  const exposedDebug = input.services.filter(s => 
    debugServices.some(debug => s.name.toLowerCase().includes(debug))
  );

  if (exposedDebug.length > 0) {
    for (const debug of exposedDebug) {
      vulnerabilities.push({
        id: `ai-debug-exposed-${debug.name}`,
        title: `Development/CI Service Exposed`,
        severity: "high",
        description: `${debug.name} service is accessible from the internet. This could allow unauthorized access to your development infrastructure.`,
        port: debug.port,
        service: debug.name,
        remediation: "Restrict access to development services using IP whitelisting or VPN access only.",
        cvssScore: 7.8,
      });
      riskScore = Math.max(riskScore, 75);
    }
  }

  // Check for unnecessary services
  if (input.services.length > 10) {
    recommendations.push("Reduce attack surface by disabling unnecessary services");
    recommendations.push("Implement the principle of least functionality");
  }

  // Port-based analysis
  const openPortCount = input.openPorts.length;
  if (openPortCount > 20) {
    vulnerabilities.push({
      id: "ai-excessive-ports",
      title: "Excessive Number of Open Ports",
      severity: "medium",
      description: `${openPortCount} ports are open. This large attack surface increases the risk of exploitation.`,
      remediation: "Review and close unnecessary ports. Implement strict firewall rules.",
      cvssScore: 5.5,
    });
    riskScore = Math.max(riskScore, 60);
  }

  return { vulnerabilities, recommendations, riskScore };
}

function analyzeOS(osFingerprint: string): {
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  riskScore: number;
} {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  const osLower = osFingerprint.toLowerCase();

  // Check for outdated OS versions
  if (osLower.includes("windows")) {
    if (osLower.includes("xp") || osLower.includes("2003") || osLower.includes("vista")) {
      vulnerabilities.push({
        id: "ai-os-eol-windows",
        title: "End-of-Life Windows Version Detected",
        severity: "critical",
        description: "This Windows version is no longer supported and doesn't receive security updates.",
        remediation: "Immediately upgrade to a supported Windows version.",
        cvssScore: 9.0,
      });
      riskScore = 95;
    }
    recommendations.push("Ensure Windows updates are installed regularly");
    recommendations.push("Enable Windows Defender and firewall");
  }

  if (osLower.includes("linux")) {
    recommendations.push("Keep kernel and packages updated");
    recommendations.push("Implement SELinux or AppArmor for additional security");
  }

  return { vulnerabilities, recommendations, riskScore };
}

function generateSummary(
  input: AnalysisInput,
  vulnerabilities: Vulnerability[],
  riskScore: number
): string {
  const criticalCount = vulnerabilities.filter(v => v.severity === "critical").length;
  const highCount = vulnerabilities.filter(v => v.severity === "high").length;
  
  let summary = `Security scan completed for ${input.domain}. `;
  
  if (criticalCount > 0) {
    summary += `URGENT: ${criticalCount} critical vulnerabilities require immediate attention. `;
  } else if (highCount > 0) {
    summary += `${highCount} high-severity issues detected that should be addressed promptly. `;
  } else if (vulnerabilities.length > 0) {
    summary += `${vulnerabilities.length} security issues found, but none are critical. `;
  } else {
    summary += `No significant vulnerabilities detected. `;
  }

  summary += `Overall risk score: ${riskScore}/100. `;
  
  if (input.services.length > 0) {
    summary += `${input.services.length} services detected on ${input.openPorts.length} open ports.`;
  }

  return summary;
}

// In production, this would call OpenAI API
export async function getAIRemediation(vulnerability: Vulnerability): Promise<string> {
  // Mock implementation
  return `
Based on the ${vulnerability.severity} severity ${vulnerability.title}:

1. Immediate Action: ${vulnerability.remediation}

2. Long-term Strategy:
   - Implement regular security audits
   - Set up automated vulnerability scanning
   - Establish a patch management process

3. Additional Considerations:
   - Monitor for any exploitation attempts
   - Review logs for suspicious activity
   - Consider implementing additional security layers
  `.trim();
}