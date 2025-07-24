import { OpenAI } from "openai";
import { PortInfo, ServiceInfo, Vulnerability } from "./scanner";

interface AnalysisInput {
  domain: string;
  openPorts: PortInfo[];
  services: ServiceInfo[];
  osFingerprint?: string;
  sslCertificate?: SSLCertificateInfo;
}

interface AnalysisResult {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  summary: string;
  recommendations: string[];
  attackVectors: string[];
}

export interface SSLCertificateInfo {
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  isExpired: boolean;
  isSelfsigned: boolean;
  protocol?: string;
  cipher?: string;
  grade?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeThreats(input: AnalysisInput): Promise<AnalysisResult> {
  // First, perform basic rule-based analysis
  const basicAnalysis = performBasicAnalysis(input);
  
  // Then enhance with AI analysis if API key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiEnhancedAnalysis = await performAIAnalysis(input, basicAnalysis);
      return aiEnhancedAnalysis;
    } catch (error) {
      console.error("AI analysis failed, falling back to basic analysis:", error);
      return basicAnalysis;
    }
  }
  
  return basicAnalysis;
}

async function performAIAnalysis(
  input: AnalysisInput, 
  basicAnalysis: AnalysisResult
): Promise<AnalysisResult> {
  const scanContext = {
    domain: input.domain,
    openPorts: input.openPorts.map(p => ({
      port: p.port,
      service: p.service,
      version: p.version
    })),
    services: input.services.map(s => ({
      name: s.name,
      version: s.version,
      port: s.port
    })),
    osFingerprint: input.osFingerprint,
    sslInfo: input.sslCertificate,
    basicVulnerabilities: basicAnalysis.vulnerabilities.map(v => ({
      title: v.title,
      severity: v.severity,
      port: v.port,
      service: v.service
    }))
  };

  const systemPrompt = `You are an expert cybersecurity analyst specializing in vulnerability assessment and penetration testing. 
Analyze the provided scan results and identify security vulnerabilities, potential attack vectors, and provide actionable recommendations.
Focus on real, exploitable vulnerabilities rather than theoretical risks. Consider the context and actual exposure.
Provide CVSS scores where applicable and reference specific CVEs when relevant.`;

  const userPrompt = `Analyze this security scan result and provide:
1. Additional vulnerabilities not detected by basic scanning
2. Potential attack vectors and exploitation techniques
3. Risk assessment considering all factors
4. Prioritized remediation recommendations
5. Specific configuration issues based on service versions

Scan Results:
${JSON.stringify(scanContext, null, 2)}

Respond in JSON format with the following structure:
{
  "additionalVulnerabilities": [
    {
      "title": "string",
      "severity": "critical|high|medium|low",
      "description": "string",
      "port": number|null,
      "service": "string|null",
      "remediation": "string",
      "cvssScore": number|null,
      "cveIds": ["string"]|null,
      "exploitability": "string"
    }
  ],
  "attackVectors": ["string"],
  "riskAssessment": {
    "overallRisk": "critical|high|medium|low",
    "riskScore": number,
    "criticalFindings": ["string"],
    "immediateActions": ["string"]
  },
  "recommendations": {
    "immediate": ["string"],
    "shortTerm": ["string"],
    "longTerm": ["string"]
  },
  "configurationIssues": ["string"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Merge AI findings with basic analysis
    const enhancedVulnerabilities: Vulnerability[] = [
      ...basicAnalysis.vulnerabilities,
      ...aiResponse.additionalVulnerabilities.map((v: any, index: number) => ({
        id: `ai-vuln-${Date.now()}-${index}`,
        title: v.title,
        severity: v.severity,
        description: v.description,
        port: v.port,
        service: v.service,
        remediation: v.remediation,
        cvssScore: v.cvssScore,
        cveIds: v.cveIds
      }))
    ];

    // Remove duplicates based on title and port
    const uniqueVulnerabilities = enhancedVulnerabilities.reduce((acc, vuln) => {
      const key = `${vuln.title}-${vuln.port || 'none'}`;
      if (!acc.some(v => `${v.title}-${v.port || 'none'}` === key)) {
        acc.push(vuln);
      }
      return acc;
    }, [] as Vulnerability[]);

    // Generate enhanced summary
    const enhancedSummary = generateEnhancedSummary(
      input,
      uniqueVulnerabilities,
      aiResponse.riskAssessment
    );

    // Combine recommendations
    const allRecommendations = [
      ...aiResponse.recommendations.immediate,
      ...aiResponse.recommendations.shortTerm,
      ...aiResponse.recommendations.longTerm,
      ...basicAnalysis.recommendations
    ].filter((r, i, arr) => arr.indexOf(r) === i); // Remove duplicates

    return {
      vulnerabilities: uniqueVulnerabilities,
      riskScore: aiResponse.riskAssessment.riskScore,
      summary: enhancedSummary,
      recommendations: allRecommendations,
      attackVectors: aiResponse.attackVectors || []
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

function performBasicAnalysis(input: AnalysisInput): AnalysisResult {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  const attackVectors: string[] = [];
  let riskScore = 0;

  // Analyze services and ports
  const serviceAnalysis = analyzeServicesAndPorts(input);
  vulnerabilities.push(...serviceAnalysis.vulnerabilities);
  recommendations.push(...serviceAnalysis.recommendations);
  attackVectors.push(...serviceAnalysis.attackVectors);
  riskScore = serviceAnalysis.riskScore;

  // Analyze SSL certificate if available
  if (input.sslCertificate) {
    const sslAnalysis = analyzeSSLCertificate(input.sslCertificate);
    vulnerabilities.push(...sslAnalysis.vulnerabilities);
    recommendations.push(...sslAnalysis.recommendations);
    riskScore = Math.max(riskScore, sslAnalysis.riskScore);
  }

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
    recommendations: [...new Set(recommendations)],
    attackVectors: [...new Set(attackVectors)]
  };
}

function analyzeServicesAndPorts(input: AnalysisInput): {
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  attackVectors: string[];
  riskScore: number;
} {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  const attackVectors: string[] = [];
  let riskScore = 0;

  // Check for database services exposed
  const dbServices = ["mysql", "postgresql", "mongodb", "redis", "memcached", "elasticsearch", "cassandra"];
  const exposedDbs = input.services.filter(s => dbServices.includes(s.name.toLowerCase()));
  
  if (exposedDbs.length > 0) {
    for (const db of exposedDbs) {
      vulnerabilities.push({
        id: `db-exposed-${db.name}-${db.port}`,
        title: `${db.name} Database Exposed to Internet`,
        severity: "critical",
        description: `${db.name} database service is directly accessible from the internet on port ${db.port}. This allows attackers to attempt authentication bypass, data theft, or denial of service attacks.`,
        port: db.port,
        service: db.name,
        remediation: `Immediately restrict access to ${db.name} using firewall rules. Implement VPN or SSH tunneling for remote access. Enable authentication and encryption.`,
        cvssScore: 9.8,
        cveIds: db.name === "redis" ? ["CVE-2022-0543"] : undefined
      });
      attackVectors.push(`Direct database access via ${db.name} on port ${db.port}`);
      riskScore = Math.max(riskScore, 95);
    }
    recommendations.push("Implement network segmentation and place all database services behind a firewall");
    recommendations.push("Use VPN or SSH tunneling for remote database access");
    recommendations.push("Enable authentication on all database services");
  }

  // Check for development/debug services
  const debugServices = [
    { name: "docker", risk: "Container escape and host compromise" },
    { name: "kubernetes", risk: "Cluster takeover" },
    { name: "jenkins", risk: "Code execution and supply chain attacks" },
    { name: "gitlab", risk: "Source code theft" },
    { name: "elasticsearch", risk: "Data exposure" }
  ];
  
  for (const debugSvc of debugServices) {
    const exposed = input.services.find(s => s.name.toLowerCase().includes(debugSvc.name));
    if (exposed) {
      vulnerabilities.push({
        id: `debug-exposed-${exposed.name}-${exposed.port}`,
        title: `${exposed.name} Development Service Exposed`,
        severity: "high",
        description: `${exposed.name} is accessible from the internet. Risk: ${debugSvc.risk}`,
        port: exposed.port,
        service: exposed.name,
        remediation: "Restrict access using IP whitelisting or move behind VPN. Implement strong authentication.",
        cvssScore: 8.8,
      });
      attackVectors.push(`${debugSvc.risk} via exposed ${exposed.name}`);
      riskScore = Math.max(riskScore, 85);
    }
  }

  // Check for unnecessary services
  if (input.services.length > 15) {
    vulnerabilities.push({
      id: "excessive-services",
      title: "Excessive Number of Network Services",
      severity: "medium",
      description: `${input.services.length} services are exposed. Each service increases attack surface.`,
      remediation: "Audit all services and disable those not required for business operations.",
      cvssScore: 5.0
    });
    recommendations.push("Implement the principle of least functionality");
    recommendations.push("Regular service audits to identify and remove unnecessary services");
  }

  // Port-based analysis
  const openPortCount = input.openPorts.length;
  if (openPortCount > 20) {
    vulnerabilities.push({
      id: "excessive-ports",
      title: "Excessive Number of Open Ports",
      severity: "medium",
      description: `${openPortCount} ports are open. This large attack surface increases the risk of exploitation.`,
      remediation: "Review and close unnecessary ports. Implement strict firewall rules with default deny policy.",
      cvssScore: 5.5,
    });
    riskScore = Math.max(riskScore, 60);
  }

  return { vulnerabilities, recommendations, attackVectors, riskScore };
}

function analyzeSSLCertificate(cert: SSLCertificateInfo): {
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  riskScore: number;
} {
  const vulnerabilities: Vulnerability[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Check certificate expiry
  if (cert.isExpired) {
    vulnerabilities.push({
      id: "ssl-cert-expired",
      title: "SSL Certificate Expired",
      severity: "critical",
      description: `SSL certificate expired on ${cert.validTo.toISOString()}. Users will see security warnings.`,
      remediation: "Immediately renew the SSL certificate.",
      cvssScore: 8.0
    });
    riskScore = Math.max(riskScore, 90);
  } else if (cert.daysUntilExpiry < 30) {
    vulnerabilities.push({
      id: "ssl-cert-expiring",
      title: "SSL Certificate Expiring Soon",
      severity: cert.daysUntilExpiry < 7 ? "high" : "medium",
      description: `SSL certificate expires in ${cert.daysUntilExpiry} days.`,
      remediation: "Plan certificate renewal before expiry.",
      cvssScore: cert.daysUntilExpiry < 7 ? 6.0 : 4.0
    });
    riskScore = Math.max(riskScore, cert.daysUntilExpiry < 7 ? 70 : 50);
  }

  // Check self-signed certificate
  if (cert.isSelfsigned) {
    vulnerabilities.push({
      id: "ssl-self-signed",
      title: "Self-Signed SSL Certificate",
      severity: "high",
      description: "Certificate is self-signed, which prevents proper identity verification.",
      remediation: "Obtain a certificate from a trusted Certificate Authority.",
      cvssScore: 7.5
    });
    riskScore = Math.max(riskScore, 75);
  }

  // Check SSL/TLS protocol
  if (cert.protocol && (cert.protocol.includes("TLS 1.0") || cert.protocol.includes("TLS 1.1"))) {
    vulnerabilities.push({
      id: "ssl-weak-protocol",
      title: "Weak TLS Protocol Version",
      severity: "high",
      description: `Server supports weak TLS protocol: ${cert.protocol}`,
      remediation: "Disable TLS 1.0 and 1.1. Only allow TLS 1.2 and above.",
      cvssScore: 7.0,
      cveIds: ["CVE-2014-3566"]
    });
    riskScore = Math.max(riskScore, 75);
  }

  // Check cipher strength
  if (cert.cipher && cert.cipher.includes("RC4")) {
    vulnerabilities.push({
      id: "ssl-weak-cipher",
      title: "Weak SSL Cipher Suite",
      severity: "medium",
      description: "Server supports weak RC4 cipher.",
      remediation: "Disable RC4 and other weak ciphers. Use strong cipher suites only.",
      cvssScore: 5.5,
      cveIds: ["CVE-2013-2566"]
    });
    riskScore = Math.max(riskScore, 60);
  }

  recommendations.push("Implement automated certificate renewal with Let's Encrypt");
  recommendations.push("Monitor certificate expiry dates proactively");
  recommendations.push("Use strong cipher suites and modern TLS versions");

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
    if (osLower.includes("xp") || osLower.includes("2003") || osLower.includes("vista") || osLower.includes("7")) {
      vulnerabilities.push({
        id: "os-eol-windows",
        title: "End-of-Life Windows Version Detected",
        severity: "critical",
        description: "This Windows version no longer receives security updates, leaving it vulnerable to all newly discovered exploits.",
        remediation: "Immediately upgrade to Windows 10 or later, or migrate to a supported operating system.",
        cvssScore: 9.5,
        cveIds: ["CVE-2017-0144", "CVE-2019-0708"] // EternalBlue, BlueKeep
      });
      riskScore = 95;
    } else if (osLower.includes("server 2008") || osLower.includes("server 2012")) {
      vulnerabilities.push({
        id: "os-legacy-windows-server",
        title: "Legacy Windows Server Version",
        severity: "high",
        description: "Running legacy Windows Server version with limited security support.",
        remediation: "Plan migration to Windows Server 2019 or later.",
        cvssScore: 7.5
      });
      riskScore = Math.max(riskScore, 80);
    }
    recommendations.push("Enable automatic Windows updates");
    recommendations.push("Implement Windows Defender and advanced threat protection");
    recommendations.push("Regular security patching schedule");
  }

  if (osLower.includes("linux")) {
    // Check for old kernel versions
    const kernelMatch = osLower.match(/(\d+)\.(\d+)\.(\d+)/);
    if (kernelMatch) {
      const majorVersion = parseInt(kernelMatch[1]);
      if (majorVersion < 4) {
        vulnerabilities.push({
          id: "os-old-linux-kernel",
          title: "Outdated Linux Kernel",
          severity: "high",
          description: `Linux kernel version ${kernelMatch[0]} is outdated and may have unpatched vulnerabilities.`,
          remediation: "Update to a supported kernel version (5.x or later recommended).",
          cvssScore: 7.0
        });
        riskScore = Math.max(riskScore, 75);
      }
    }
    recommendations.push("Keep kernel and system packages updated");
    recommendations.push("Implement SELinux or AppArmor for mandatory access control");
    recommendations.push("Use unattended-upgrades for security patches");
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
    summary += `⚠️ URGENT: ${criticalCount} critical vulnerabilities require immediate attention. `;
  } else if (highCount > 0) {
    summary += `${highCount} high-severity issues detected that should be addressed promptly. `;
  } else if (vulnerabilities.length > 0) {
    summary += `${vulnerabilities.length} security issues found, but none are critical. `;
  } else {
    summary += `✅ No significant vulnerabilities detected. `;
  }

  summary += `Overall risk score: ${riskScore}/100. `;
  
  if (input.services.length > 0) {
    summary += `${input.services.length} services detected on ${input.openPorts.length} open ports.`;
  }

  return summary;
}

function generateEnhancedSummary(
  input: AnalysisInput,
  vulnerabilities: Vulnerability[],
  riskAssessment: any
): string {
  const criticalCount = vulnerabilities.filter(v => v.severity === "critical").length;
  const highCount = vulnerabilities.filter(v => v.severity === "high").length;
  
  let summary = `Comprehensive AI-powered security analysis completed for ${input.domain}. `;
  
  if (riskAssessment.criticalFindings && riskAssessment.criticalFindings.length > 0) {
    summary += `🚨 CRITICAL FINDINGS: ${riskAssessment.criticalFindings.join(", ")}. `;
  }
  
  summary += `Risk Level: ${riskAssessment.overallRisk.toUpperCase()} (${riskAssessment.riskScore}/100). `;
  
  if (criticalCount > 0 || highCount > 0) {
    summary += `Found ${criticalCount} critical and ${highCount} high-severity vulnerabilities. `;
  }
  
  if (riskAssessment.immediateActions && riskAssessment.immediateActions.length > 0) {
    summary += `Immediate actions required: ${riskAssessment.immediateActions[0]}. `;
  }
  
  summary += `Analysis identified ${vulnerabilities.length} total security issues across ${input.services.length} services.`;

  return summary;
}

// Get AI-powered remediation advice
export async function getAIRemediation(vulnerability: Vulnerability): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getBasicRemediation(vulnerability);
  }

  try {
    const prompt = `As a cybersecurity expert, provide detailed remediation steps for this vulnerability:

Title: ${vulnerability.title}
Severity: ${vulnerability.severity}
Description: ${vulnerability.description}
Service: ${vulnerability.service || "N/A"}
Port: ${vulnerability.port || "N/A"}
CVSS Score: ${vulnerability.cvssScore || "N/A"}
CVE IDs: ${vulnerability.cveIds?.join(", ") || "N/A"}

Provide:
1. Step-by-step remediation instructions
2. Configuration examples where applicable
3. Testing/verification steps
4. Alternative mitigations if full remediation isn't immediately possible
5. Links to relevant documentation

Keep the response practical and actionable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a senior cybersecurity engineer providing remediation guidance."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    return completion.choices[0].message.content || getBasicRemediation(vulnerability);
  } catch (error) {
    console.error("AI remediation error:", error);
    return getBasicRemediation(vulnerability);
  }
}

function getBasicRemediation(vulnerability: Vulnerability): string {
  return `
## Remediation for ${vulnerability.title}

**Severity:** ${vulnerability.severity.toUpperCase()}
${vulnerability.cvssScore ? `**CVSS Score:** ${vulnerability.cvssScore}` : ""}

### Immediate Actions:
${vulnerability.remediation}

### Additional Steps:
1. **Verification:** After applying the fix, rescan to confirm the vulnerability is resolved
2. **Monitoring:** Set up alerts for any attempts to exploit this vulnerability
3. **Documentation:** Document the remediation steps taken for compliance
4. **Review:** Check for similar vulnerabilities in other systems

### Best Practices:
- Implement a regular patching schedule
- Use automated vulnerability scanning
- Maintain an inventory of all exposed services
- Follow the principle of least privilege

${vulnerability.cveIds ? `### References:\n${vulnerability.cveIds.map(cve => `- https://nvd.nist.gov/vuln/detail/${cve}`).join('\n')}` : ""}
  `.trim();
}