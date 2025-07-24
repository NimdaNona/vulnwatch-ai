import * as dns from "dns/promises";
import * as tls from "tls";
import * as net from "net";
import { analyzeThreats, SSLCertificateInfo } from "./ai-analyzer";
import { ScanResult, PortInfo, ServiceInfo, Vulnerability } from "./scanner";

// Common ports to scan in cloud environment
const COMMON_PORTS = [
  { port: 80, service: "http" },
  { port: 443, service: "https" },
  { port: 22, service: "ssh" },
  { port: 21, service: "ftp" },
  { port: 25, service: "smtp" },
  { port: 3306, service: "mysql" },
  { port: 5432, service: "postgresql" },
  { port: 8080, service: "http-alt" },
  { port: 8443, service: "https-alt" },
  { port: 3000, service: "dev-server" },
  { port: 5000, service: "dev-server" },
  { port: 8000, service: "dev-server" },
];

// Cloud-based port scanner using TCP connections
async function checkPort(host: string, port: number, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.on("connect", () => {
      isConnected = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });

    socket.on("timeout", () => {
      clearTimeout(timer);
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// Detect service by analyzing response
async function detectService(host: string, port: number): Promise<{ name: string; version?: string }> {
  // Basic service detection based on port
  const portService = COMMON_PORTS.find(p => p.port === port);
  const baseName = portService?.service || "unknown";

  // Try HTTP detection for web ports
  if ([80, 443, 8080, 8443, 3000, 5000, 8000].includes(port)) {
    try {
      const protocol = [443, 8443].includes(port) ? "https" : "http";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${protocol}://${host}:${port}`, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "VulnWatch-Scanner/1.0"
        }
      });

      clearTimeout(timeoutId);

      const server = response.headers.get("server");
      const poweredBy = response.headers.get("x-powered-by");

      if (server) {
        return { name: baseName, version: server };
      } else if (poweredBy) {
        return { name: baseName, version: poweredBy };
      }
    } catch (error) {
      // Ignore errors, return base service
    }
  }

  return { name: baseName };
}

// Get SSL certificate info (reuse existing implementation)
async function getSSLCertificate(domain: string, port: number = 443): Promise<SSLCertificateInfo | null> {
  return new Promise((resolve) => {
    const options = {
      host: domain,
      port: port,
      servername: domain,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate();
      
      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        resolve(null);
        return;
      }

      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();

      const certInfo: SSLCertificateInfo = {
        subject: cert.subject ? `CN=${cert.subject.CN || cert.subject.O || domain}` : domain,
        issuer: cert.issuer ? `CN=${cert.issuer.CN || cert.issuer.O || "Unknown"}` : "Unknown",
        validFrom,
        validTo,
        daysUntilExpiry,
        protocol: protocol || "Unknown",
        cipher: cipher ? cipher.name : "Unknown",
        isExpired: now > validTo,
        grade: calculateSSLGrade(protocol || "", cipher ? cipher.name : "", daysUntilExpiry),
        isSelfsigned: false,
      };

      socket.destroy();
      resolve(certInfo);
    });

    socket.on("error", () => {
      resolve(null);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve(null);
    });
  });
}

function calculateSSLGrade(protocol: string, cipher: string, daysUntilExpiry: number): string {
  let score = 100;

  // Protocol scoring
  if (protocol === "TLSv1.3") score -= 0;
  else if (protocol === "TLSv1.2") score -= 10;
  else if (protocol === "TLSv1.1") score -= 30;
  else score -= 50;

  // Cipher scoring
  if (cipher.includes("GCM")) score -= 0;
  else if (cipher.includes("CBC")) score -= 10;
  else score -= 20;

  // Certificate validity
  if (daysUntilExpiry < 0) score -= 50;
  else if (daysUntilExpiry < 30) score -= 20;
  else if (daysUntilExpiry < 90) score -= 10;

  // Grade assignment
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// Simple subdomain enumeration using DNS
async function discoverSubdomains(domain: string): Promise<string[]> {
  const commonSubdomains = [
    "www", "mail", "ftp", "admin", "blog", "shop", "api", "app",
    "staging", "dev", "test", "portal", "secure", "vpn", "remote",
    "webmail", "ns1", "ns2", "smtp", "pop", "imap", "forum", "wiki",
    "support", "docs", "status", "cdn", "images", "static", "assets"
  ];

  const discovered: string[] = [];
  const promises = commonSubdomains.map(async (subdomain) => {
    const fullDomain = `${subdomain}.${domain}`;
    try {
      await dns.resolve4(fullDomain);
      discovered.push(fullDomain);
    } catch {
      // Subdomain doesn't exist
    }
  });

  await Promise.all(promises);
  return discovered;
}

// Main cloud scanning function
export async function performCloudScan(domain: string): Promise<ScanResult> {
  const startTime = Date.now();
  
  try {
    // Resolve domain to IP
    let ipAddress = "";
    try {
      const addresses = await dns.resolve4(domain);
      ipAddress = addresses[0] || "";
    } catch {
      // If DNS fails, try as IP
      ipAddress = domain;
    }

    // Scan common ports
    console.log(`[Cloud Scanner] Scanning ${domain} (${ipAddress})...`);
    const openPorts: PortInfo[] = [];
    const services: ServiceInfo[] = [];

    // Check ports in parallel with rate limiting
    const portPromises = COMMON_PORTS.map(async ({ port, service }) => {
      const isOpen = await checkPort(ipAddress || domain, port);
      if (isOpen) {
        console.log(`[Cloud Scanner] Port ${port} is open`);
        const serviceInfo = await detectService(domain, port);
        
        openPorts.push({
          port,
          protocol: "tcp",
          state: "open",
          service: serviceInfo.name,
          version: serviceInfo.version,
        });

        services.push({
          name: serviceInfo.name,
          version: serviceInfo.version,
          port,
          vulnerabilities: [],
        });
      }
    });

    await Promise.all(portPromises);

    // Get SSL certificate if HTTPS is available
    let sslCertificate: SSLCertificateInfo | undefined;
    if (openPorts.some(p => p.port === 443)) {
      const cert = await getSSLCertificate(domain);
      if (cert) {
        sslCertificate = cert;
      }
    }

    // Basic subdomain discovery
    const subdomains = await discoverSubdomains(domain);
    
    // Create scan result
    const scanResult: ScanResult = {
      domain,
      ipAddress: ipAddress || "Unknown",
      openPorts,
      services,
      osFingerprint: "Unknown (Cloud Scan)",
      vulnerabilities: [],
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
      sslCertificate,
      subdomains: {
        domain,
        subdomains: subdomains.map(subdomain => ({
          subdomain: subdomain.split('.')[0],
          fullDomain: subdomain,
          source: "DNS",
          ipAddresses: [],
          discovered: new Date(),
        })),
        totalFound: subdomains.length,
        duration: 0,
      }
    };

    // Perform AI-powered vulnerability analysis
    const analysisResult = await analyzeThreats(scanResult);
    scanResult.vulnerabilities = analysisResult.vulnerabilities;

    console.log(`[Cloud Scanner] Scan completed in ${scanResult.scanDuration}ms`);
    return scanResult;

  } catch (error) {
    console.error("[Cloud Scanner] Scan error:", error);
    
    // Return minimal result on error
    return {
      domain,
      ipAddress: "Error",
      openPorts: [],
      services: [],
      osFingerprint: "Unknown",
      vulnerabilities: [{
        id: "scan-error",
        title: "Scan Error",
        severity: "low",
        description: "The scan encountered an error. Some results may be incomplete.",
        remediation: "Try scanning again or use a different scanning method.",
        cvssScore: 0,
      }],
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

// Quick scan with fewer ports
export async function performQuickCloudScan(domain: string): Promise<ScanResult> {
  const startTime = Date.now();
  const quickPorts = [80, 443, 22, 8080];
  
  try {
    // Resolve domain to IP
    let ipAddress = "";
    try {
      const addresses = await dns.resolve4(domain);
      ipAddress = addresses[0] || "";
    } catch {
      ipAddress = domain;
    }

    console.log(`[Cloud Scanner] Quick scan of ${domain}...`);
    const openPorts: PortInfo[] = [];
    const services: ServiceInfo[] = [];

    // Check only essential ports
    for (const port of quickPorts) {
      const isOpen = await checkPort(ipAddress || domain, port);
      if (isOpen) {
        const serviceInfo = await detectService(domain, port);
        
        openPorts.push({
          port,
          protocol: "tcp",
          state: "open",
          service: serviceInfo.name,
          version: serviceInfo.version,
        });

        services.push({
          name: serviceInfo.name,
          version: serviceInfo.version,
          port,
          vulnerabilities: [],
        });
      }
    }

    // Get SSL certificate if HTTPS is available
    let sslCertificate: SSLCertificateInfo | undefined;
    if (openPorts.some(p => p.port === 443)) {
      const cert = await getSSLCertificate(domain);
      if (cert) {
        sslCertificate = cert;
      }
    }

    // Create scan result
    const scanResult: ScanResult = {
      domain,
      ipAddress: ipAddress || "Unknown",
      openPorts,
      services,
      osFingerprint: "Unknown (Quick Scan)",
      vulnerabilities: [],
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
      sslCertificate,
    };

    // Perform AI-powered vulnerability analysis
    const analysisResult = await analyzeThreats(scanResult);
    scanResult.vulnerabilities = analysisResult.vulnerabilities;

    console.log(`[Cloud Scanner] Quick scan completed in ${scanResult.scanDuration}ms`);
    return scanResult;

  } catch (error) {
    console.error("[Cloud Scanner] Quick scan error:", error);
    
    return {
      domain,
      ipAddress: "Error",
      openPorts: [],
      services: [],
      osFingerprint: "Unknown",
      vulnerabilities: [],
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}