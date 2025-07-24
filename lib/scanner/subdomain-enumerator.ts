import { exec } from "child_process";
import { promisify } from "util";
import dns from "dns/promises";

const execAsync = promisify(exec);

export interface SubdomainInfo {
  subdomain: string;
  fullDomain: string;
  ipAddresses: string[];
  discovered: Date;
  source: string;
}

export interface SubdomainEnumerationResult {
  domain: string;
  subdomains: SubdomainInfo[];
  totalFound: number;
  duration: number;
}

// Common subdomains to check
const COMMON_SUBDOMAINS = [
  "www", "mail", "ftp", "localhost", "webmail", "smtp", "pop", "ns1", "ns2",
  "blog", "dev", "staging", "beta", "test", "api", "app", "admin", "portal",
  "cdn", "static", "assets", "img", "images", "media", "files", "docs",
  "vpn", "remote", "server", "git", "repo", "jenkins", "jira", "wiki",
  "forum", "shop", "store", "m", "mobile", "api-v1", "api-v2", "v1", "v2"
];

export async function enumerateSubdomains(
  domain: string,
  options: {
    useExternal?: boolean;
    timeout?: number;
    maxSubdomains?: number;
  } = {}
): Promise<SubdomainEnumerationResult> {
  const {
    useExternal = true,
    timeout = 30000,
    maxSubdomains = 100
  } = options;

  const startTime = Date.now();
  const discoveredSubdomains = new Map<string, SubdomainInfo>();

  try {
    // 1. DNS brute force with common subdomains
    await bruteForceDNS(domain, discoveredSubdomains, maxSubdomains);

    // 2. Certificate transparency logs (if external APIs enabled)
    if (useExternal) {
      await queryCertificateTransparency(domain, discoveredSubdomains, maxSubdomains);
    }

    // 3. Try zone transfer (usually blocked but worth trying)
    await attemptZoneTransfer(domain, discoveredSubdomains);

    // 4. Resolve IP addresses for all discovered subdomains
    await resolveSubdomainIPs(discoveredSubdomains);

    const duration = Date.now() - startTime;

    return {
      domain,
      subdomains: Array.from(discoveredSubdomains.values()),
      totalFound: discoveredSubdomains.size,
      duration
    };
  } catch (error) {
    console.error("Subdomain enumeration error:", error);
    throw error;
  }
}

async function bruteForceDNS(
  domain: string,
  discoveredSubdomains: Map<string, SubdomainInfo>,
  maxSubdomains: number
): Promise<void> {
  const promises = COMMON_SUBDOMAINS.map(async (subdomain) => {
    if (discoveredSubdomains.size >= maxSubdomains) return;

    const fullDomain = `${subdomain}.${domain}`;
    try {
      const addresses = await dns.resolve4(fullDomain);
      if (addresses && addresses.length > 0) {
        discoveredSubdomains.set(fullDomain, {
          subdomain,
          fullDomain,
          ipAddresses: addresses,
          discovered: new Date(),
          source: "DNS Brute Force"
        });
      }
    } catch (error) {
      // Subdomain doesn't exist or can't be resolved
    }
  });

  await Promise.allSettled(promises);
}

async function queryCertificateTransparency(
  domain: string,
  discoveredSubdomains: Map<string, SubdomainInfo>,
  maxSubdomains: number
): Promise<void> {
  try {
    // Using crt.sh API for certificate transparency logs
    const response = await fetch(
      `https://crt.sh/?q=%.${domain}&output=json`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      console.warn("Certificate transparency query failed:", response.status);
      return;
    }

    const data = await response.json();
    const uniqueNames = new Set<string>();

    for (const cert of data) {
      if (discoveredSubdomains.size >= maxSubdomains) break;

      const nameValue = cert.name_value;
      if (nameValue && typeof nameValue === "string") {
        // Extract all domains from the certificate
        const names = nameValue.split("\n");
        for (const name of names) {
          const cleanName = name.trim().toLowerCase();
          if (cleanName.endsWith(`.${domain}`) && !uniqueNames.has(cleanName)) {
            uniqueNames.add(cleanName);
            
            const subdomain = cleanName.replace(`.${domain}`, "");
            if (subdomain && !discoveredSubdomains.has(cleanName)) {
              discoveredSubdomains.set(cleanName, {
                subdomain,
                fullDomain: cleanName,
                ipAddresses: [],
                discovered: new Date(),
                source: "Certificate Transparency"
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn("Certificate transparency enumeration failed:", error);
  }
}

async function attemptZoneTransfer(
  domain: string,
  discoveredSubdomains: Map<string, SubdomainInfo>
): Promise<void> {
  try {
    // Get nameservers for the domain
    const nameservers = await dns.resolveNs(domain);
    
    for (const ns of nameservers.slice(0, 2)) { // Only try first 2 nameservers
      try {
        // Attempt zone transfer using dig
        const { stdout } = await execAsync(
          `dig @${ns} ${domain} AXFR +short`,
          { timeout: 5000 }
        );

        if (stdout && stdout.length > 0) {
          const lines = stdout.split("\n");
          for (const line of lines) {
            const match = line.match(/^(\S+)\.\s+\d+\s+IN\s+A\s+(\S+)/);
            if (match) {
              const fullDomain = match[1].toLowerCase();
              const ipAddress = match[2];
              
              if (fullDomain.endsWith(`.${domain}`)) {
                const subdomain = fullDomain.replace(`.${domain}`, "");
                if (subdomain && !discoveredSubdomains.has(fullDomain)) {
                  discoveredSubdomains.set(fullDomain, {
                    subdomain,
                    fullDomain,
                    ipAddresses: [ipAddress],
                    discovered: new Date(),
                    source: "Zone Transfer"
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        // Zone transfer failed (expected in most cases)
      }
    }
  } catch (error) {
    // Could not get nameservers
  }
}

async function resolveSubdomainIPs(
  discoveredSubdomains: Map<string, SubdomainInfo>
): Promise<void> {
  const promises = Array.from(discoveredSubdomains.values()).map(async (subdomain) => {
    if (subdomain.ipAddresses.length === 0) {
      try {
        const addresses = await dns.resolve4(subdomain.fullDomain);
        subdomain.ipAddresses = addresses;
      } catch (error) {
        // Could not resolve IP addresses
      }
    }
  });

  await Promise.allSettled(promises);
}

// Check if a subdomain is using CDN/WAF
export async function checkSubdomainProtection(subdomain: SubdomainInfo): Promise<{
  isProtected: boolean;
  protectionType?: string;
  provider?: string;
}> {
  // Common CDN/WAF IP ranges and patterns
  const cdnPatterns = {
    cloudflare: /^104\.(1[6-9]|2[0-9]|3[01])\./,
    akamai: /^23\.(4[0-9]|5[0-9]|6[0-7])\./,
    fastly: /^151\.101\./,
    cloudfront: /^(13\.|52\.|54\.|143\.204\.|205\.251\.|216\.137\.)/, 
  };

  for (const ip of subdomain.ipAddresses) {
    for (const [provider, pattern] of Object.entries(cdnPatterns)) {
      if (pattern.test(ip)) {
        return {
          isProtected: true,
          protectionType: "CDN/WAF",
          provider
        };
      }
    }
  }

  return { isProtected: false };
}