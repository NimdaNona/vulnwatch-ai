import nmap from "node-nmap";
import { analyzeThreats } from "./ai-analyzer";

// Initialize nmap
nmap.nmapLocation = "nmap"; // Assumes nmap is in PATH

export interface ScanResult {
  domain: string;
  ipAddress: string;
  openPorts: PortInfo[];
  services: ServiceInfo[];
  osFingerprint?: string;
  vulnerabilities: Vulnerability[];
  scanDuration: number;
  timestamp: Date;
}

export interface PortInfo {
  port: number;
  protocol: string;
  state: string;
  service?: string;
  version?: string;
}

export interface ServiceInfo {
  name: string;
  version?: string;
  port: number;
  vulnerabilities: string[];
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  port?: number;
  service?: string;
  remediation: string;
  cvssScore?: number;
  cveIds?: string[];
}

export async function performPortScan(domain: string): Promise<ScanResult> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Comprehensive scan with service detection and OS fingerprinting
    const nmapScan = new nmap.NmapScan(domain, "-sV -sC -O -A");
    
    nmapScan.on("complete", async (data: any) => {
      try {
        const host = data[0];
        
        if (!host) {
          throw new Error("No host data returned from scan");
        }

        // Extract port information
        const openPorts: PortInfo[] = [];
        const services: ServiceInfo[] = [];

        if (host.openPorts) {
          for (const port of host.openPorts) {
            const portInfo: PortInfo = {
              port: parseInt(port.port),
              protocol: port.protocol || "tcp",
              state: "open",
              service: port.service,
              version: port.version,
            };
            
            openPorts.push(portInfo);

            // Create service info
            if (port.service) {
              const existingService = services.find(s => s.name === port.service);
              if (!existingService) {
                services.push({
                  name: port.service,
                  version: port.version,
                  port: parseInt(port.port),
                  vulnerabilities: [],
                });
              }
            }
          }
        }

        // Basic vulnerability detection based on services
        const vulnerabilities = await detectVulnerabilities(services, openPorts);

        // Get AI-powered threat analysis
        const aiAnalysis = await analyzeThreats({
          domain,
          openPorts,
          services,
          osFingerprint: host.osNmap,
        });

        // Merge AI findings with basic detection
        const allVulnerabilities = [...vulnerabilities, ...aiAnalysis.vulnerabilities];

        const scanResult: ScanResult = {
          domain,
          ipAddress: host.ip || domain,
          openPorts,
          services,
          osFingerprint: host.osNmap,
          vulnerabilities: allVulnerabilities,
          scanDuration: Date.now() - startTime,
          timestamp: new Date(),
        };

        resolve(scanResult);
      } catch (error) {
        console.error("Error processing scan results:", error);
        reject(error);
      }
    });

    nmapScan.on("error", (error: any) => {
      console.error("Nmap scan error:", error);
      reject(new Error(`Scan failed: ${error.message || error}`));
    });

    // Start the scan
    nmapScan.startScan();
  });
}

async function detectVulnerabilities(
  services: ServiceInfo[],
  ports: PortInfo[]
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  // Check for common vulnerable services
  for (const service of services) {
    // SSH on non-standard port
    if (service.name === "ssh" && service.port !== 22) {
      vulnerabilities.push({
        id: `vuln-ssh-${service.port}`,
        title: "SSH Service on Non-Standard Port",
        severity: "low",
        description: `SSH service detected on port ${service.port}. While not inherently vulnerable, non-standard ports may indicate security through obscurity.`,
        port: service.port,
        service: "ssh",
        remediation: "Ensure SSH is properly configured with key-based authentication and disable password authentication.",
      });
    }

    // Telnet service
    if (service.name === "telnet") {
      vulnerabilities.push({
        id: `vuln-telnet-${service.port}`,
        title: "Telnet Service Detected",
        severity: "critical",
        description: "Telnet transmits data in plain text, including passwords. This is a severe security risk.",
        port: service.port,
        service: "telnet",
        remediation: "Disable Telnet immediately and use SSH for remote access instead.",
        cvssScore: 9.8,
      });
    }

    // FTP service
    if (service.name === "ftp") {
      vulnerabilities.push({
        id: `vuln-ftp-${service.port}`,
        title: "FTP Service Detected",
        severity: "high",
        description: "FTP transmits credentials in plain text and is vulnerable to various attacks.",
        port: service.port,
        service: "ftp",
        remediation: "Replace FTP with SFTP or FTPS for secure file transfers.",
        cvssScore: 7.5,
      });
    }

    // HTTP without HTTPS
    if (service.name === "http" && !services.some(s => s.name === "https")) {
      vulnerabilities.push({
        id: `vuln-http-only`,
        title: "HTTP Without HTTPS",
        severity: "medium",
        description: "Website is accessible over unencrypted HTTP without HTTPS alternative.",
        port: service.port,
        service: "http",
        remediation: "Implement HTTPS with a valid SSL/TLS certificate and redirect all HTTP traffic to HTTPS.",
        cvssScore: 5.3,
      });
    }

    // Old SSL/TLS versions
    if (service.version && (service.version.includes("SSLv2") || service.version.includes("SSLv3"))) {
      vulnerabilities.push({
        id: `vuln-ssl-old-${service.port}`,
        title: "Outdated SSL/TLS Version",
        severity: "high",
        description: `Service is using outdated SSL/TLS version: ${service.version}`,
        port: service.port,
        service: service.name,
        remediation: "Update to TLS 1.2 or higher and disable older SSL/TLS versions.",
        cvssScore: 7.0,
      });
    }
  }

  // Check for risky open ports
  const riskyPorts = [
    { port: 135, name: "RPC", severity: "high" as const },
    { port: 137, name: "NetBIOS", severity: "high" as const },
    { port: 139, name: "NetBIOS", severity: "high" as const },
    { port: 445, name: "SMB", severity: "critical" as const },
    { port: 3389, name: "RDP", severity: "high" as const },
    { port: 5900, name: "VNC", severity: "high" as const },
  ];

  for (const riskyPort of riskyPorts) {
    if (ports.some(p => p.port === riskyPort.port && p.state === "open")) {
      vulnerabilities.push({
        id: `vuln-port-${riskyPort.port}`,
        title: `${riskyPort.name} Port Open`,
        severity: riskyPort.severity,
        description: `Port ${riskyPort.port} (${riskyPort.name}) is open and accessible from the internet.`,
        port: riskyPort.port,
        remediation: `Close port ${riskyPort.port} or restrict access using firewall rules to trusted IP addresses only.`,
        cvssScore: riskyPort.severity === "critical" ? 9.0 : 7.0,
      });
    }
  }

  return vulnerabilities;
}

// Web vulnerability scanner (basic implementation)
export async function performWebScan(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    // Check for common web vulnerabilities
    // This is a basic implementation - in production, integrate with OWASP ZAP or similar
    
    // Check security headers
    const response = await fetch(url, { method: "HEAD" });
    const headers = response.headers;

    // Check for missing security headers
    const securityHeaders = [
      { name: "X-Frame-Options", missing: "Clickjacking Protection Missing" },
      { name: "X-Content-Type-Options", missing: "MIME Type Sniffing Protection Missing" },
      { name: "X-XSS-Protection", missing: "XSS Protection Header Missing" },
      { name: "Strict-Transport-Security", missing: "HSTS Not Enabled" },
      { name: "Content-Security-Policy", missing: "Content Security Policy Missing" },
    ];

    for (const header of securityHeaders) {
      if (!headers.get(header.name.toLowerCase())) {
        vulnerabilities.push({
          id: `vuln-header-${header.name.toLowerCase()}`,
          title: header.missing,
          severity: header.name === "Strict-Transport-Security" ? "high" : "medium",
          description: `The ${header.name} header is not set, leaving the application vulnerable to certain attacks.`,
          remediation: `Add the ${header.name} header to all HTTP responses.`,
          cvssScore: header.name === "Strict-Transport-Security" ? 6.5 : 4.3,
        });
      }
    }

    // Check for server information disclosure
    const serverHeader = headers.get("server");
    if (serverHeader && (serverHeader.includes("version") || serverHeader.includes("/"))) {
      vulnerabilities.push({
        id: "vuln-server-disclosure",
        title: "Server Version Disclosure",
        severity: "low",
        description: `Server header reveals version information: ${serverHeader}`,
        remediation: "Configure server to hide version information in HTTP headers.",
        cvssScore: 3.1,
      });
    }

  } catch (error) {
    console.error("Web scan error:", error);
  }

  return vulnerabilities;
}

// Main scan orchestrator
export async function runComprehensiveScan(target: string): Promise<ScanResult> {
  console.log(`Starting comprehensive scan for: ${target}`);
  
  try {
    // Run port scan
    const scanResult = await performPortScan(target);
    
    // If web services detected, run web scan
    const hasWebService = scanResult.services.some(
      s => s.name === "http" || s.name === "https"
    );
    
    if (hasWebService) {
      const protocol = scanResult.services.find(s => s.name === "https") ? "https" : "http";
      const webVulns = await performWebScan(`${protocol}://${target}`);
      scanResult.vulnerabilities.push(...webVulns);
    }
    
    // Sort vulnerabilities by severity
    scanResult.vulnerabilities.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    return scanResult;
  } catch (error) {
    console.error("Comprehensive scan error:", error);
    throw error;
  }
}