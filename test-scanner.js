const { runComprehensiveScan } = require('./lib/scanner/scanner');

async function testScanner() {
  console.log('Testing AI-powered vulnerability scanner...\n');
  
  try {
    // Test with a common domain that should have some findings
    const target = 'example.com';
    console.log(`Starting scan for: ${target}`);
    console.log('This will test:');
    console.log('- Port scanning');
    console.log('- Service detection');
    console.log('- SSL/TLS certificate checking');
    console.log('- Web vulnerability detection');
    console.log('- AI-powered threat analysis');
    console.log('- Subdomain enumeration\n');
    
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
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('\nMake sure:');
    console.error('1. nmap is installed (sudo apt-get install nmap)');
    console.error('2. OPENAI_API_KEY is set in .env.local');
    console.error('3. You have internet connectivity');
    process.exit(1);
  }
}

// Run the test
testScanner().catch(console.error);