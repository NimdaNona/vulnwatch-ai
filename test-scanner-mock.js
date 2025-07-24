// Mock test for AI-powered scanner when nmap is not available
const { runComprehensiveScan } = require('./lib/scanner/scanner');

// Override exec to simulate nmap output
const originalExec = require('util').promisify(require('child_process').exec);
require('util').promisify = function(fn) {
  if (fn === require('child_process').exec) {
    return async (command) => {
      if (command.includes('nmap')) {
        // Simulate nmap output
        if (command.includes('-p-')) {
          return {
            stdout: `
Starting Nmap scan...
Nmap scan report for example.com (93.184.215.14)
Host is up (0.012s latency).
Not shown: 65533 closed ports
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds
            `,
            stderr: ''
          };
        } else if (command.includes('-sV')) {
          return {
            stdout: `
Starting Nmap scan...
Nmap scan report for example.com (93.184.215.14)
Host is up (0.012s latency).

PORT    STATE SERVICE VERSION
80/tcp  open  http    nginx 1.21.3
443/tcp open  https   nginx 1.21.3

Service detection performed.
Nmap done: 1 IP address (1 host up) scanned in 1.23 seconds
            `,
            stderr: ''
          };
        } else if (command.includes('-O')) {
          return {
            stdout: `
Starting Nmap scan...
Nmap scan report for example.com (93.184.215.14)
Host is up (0.012s latency).

Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9

Nmap done: 1 IP address (1 host up) scanned in 1.45 seconds
            `,
            stderr: ''
          };
        }
      }
      // For other commands, use original exec
      return originalExec(command);
    };
  }
  return originalExec;
};

async function testScanner() {
  console.log('Testing AI-powered vulnerability scanner (MOCK MODE - nmap not installed)...\n');
  
  try {
    // Test with a common domain that should have some findings
    const target = 'example.com';
    console.log(`Starting scan for: ${target}`);
    console.log('This will test:');
    console.log('- Port scanning (mocked)');
    console.log('- Service detection (mocked)');
    console.log('- SSL/TLS certificate checking (real)');
    console.log('- Web vulnerability detection (real)');
    console.log('- AI-powered threat analysis (real with OpenAI)');
    console.log('- Subdomain enumeration (real)\n');
    
    const startTime = Date.now();
    const result = await runComprehensiveScan(target);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n=== SCAN RESULTS ===\n');
    console.log(`Target: ${result.domain}`);
    console.log(`IP Address: ${result.ipAddress}`);
    console.log(`Scan Duration: ${duration} seconds`);
    console.log(`Open Ports: ${result.openPorts.length}`);
    console.log(`Services Detected: ${result.services.length}`);
    console.log(`Vulnerabilities Found: ${result.vulnerabilities.length}`);
    
    if (result.sslCertificate) {
      console.log('\n--- SSL Certificate ---');
      console.log(`Issuer: ${result.sslCertificate.issuer}`);
      console.log(`Subject: ${result.sslCertificate.subject}`);
      console.log(`Valid Until: ${result.sslCertificate.validTo}`);
      console.log(`Days Until Expiry: ${result.sslCertificate.daysUntilExpiry}`);
      console.log(`SSL Grade: ${result.sslCertificate.grade || 'N/A'}`);
    }
    
    if (result.subdomains && result.subdomains.totalFound > 0) {
      console.log('\n--- Subdomains ---');
      console.log(`Total Found: ${result.subdomains.totalFound}`);
      console.log('Sample subdomains:');
      result.subdomains.subdomains.slice(0, 5).forEach(sub => {
        console.log(`  - ${sub.fullDomain} (${sub.ipAddresses.length} IPs)`);
      });
    }
    
    if (result.vulnerabilities.length > 0) {
      console.log('\n--- Top Vulnerabilities ---');
      const criticalAndHigh = result.vulnerabilities.filter(v => 
        v.severity === 'critical' || v.severity === 'high'
      );
      
      (criticalAndHigh.length > 0 ? criticalAndHigh : result.vulnerabilities)
        .slice(0, 3)
        .forEach(vuln => {
          console.log(`\n[${vuln.severity.toUpperCase()}] ${vuln.title}`);
          console.log(`Description: ${vuln.description.substring(0, 150)}...`);
          if (vuln.cvssScore) console.log(`CVSS Score: ${vuln.cvssScore}`);
          if (vuln.cveIds && vuln.cveIds.length > 0) {
            console.log(`CVE IDs: ${vuln.cveIds.join(', ')}`);
          }
        });
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('\nNOTE: This was a MOCK test. Port scanning results were simulated.');
    console.log('For real scanning, install nmap: sudo apt-get install nmap');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('\nMake sure:');
    console.error('1. OPENAI_API_KEY is set in .env.local');
    console.error('2. You have internet connectivity');
    process.exit(1);
  }
}

// Run the test
testScanner().catch(console.error);