// Test script to verify AI-powered vulnerability analysis
require('dotenv').config({ path: '.env.local' });

// Import the AI analyzer directly
const { analyzeThreats } = require('./.next/server/chunks/325.js');

// Mock scan data that would normally come from nmap
const mockScanData = {
  domain: "example.com",
  ipAddress: "93.184.215.14",
  openPorts: [
    { port: 80, protocol: "tcp", state: "open", service: "http", version: "nginx 1.21.3" },
    { port: 443, protocol: "tcp", state: "open", service: "https", version: "nginx 1.21.3" },
    { port: 22, protocol: "tcp", state: "open", service: "ssh", version: "OpenSSH 7.4" },
    { port: 3306, protocol: "tcp", state: "open", service: "mysql", version: "MySQL 5.7.32" }
  ],
  services: [
    { name: "http", version: "nginx 1.21.3", port: 80, vulnerabilities: [] },
    { name: "https", version: "nginx 1.21.3", port: 443, vulnerabilities: [] },
    { name: "ssh", version: "OpenSSH 7.4", port: 22, vulnerabilities: [] },
    { name: "mysql", version: "MySQL 5.7.32", port: 3306, vulnerabilities: [] }
  ],
  osFingerprint: "Linux 3.2 - 4.9",
  sslCertificate: {
    subject: "CN=*.example.com",
    issuer: "CN=DigiCert SHA2 Secure Server CA,O=DigiCert Inc,C=US",
    validFrom: "2023-11-14T00:00:00.000Z",
    validTo: "2024-11-23T23:59:59.000Z",
    daysUntilExpiry: 45,
    protocol: "TLSv1.2",
    cipher: "ECDHE-RSA-AES256-GCM-SHA384",
    isExpired: false,
    isExpiringSoon: true
  }
};

async function testAIAnalysis() {
  console.log('Testing AI-powered vulnerability analysis...\n');
  console.log('Configuration:');
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('\n---\n');

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-proj-example-key-replace-with-your-actual-key') {
    console.error('ERROR: OPENAI_API_KEY is not properly set in .env.local');
    console.error('Please set a valid OpenAI API key to test AI analysis');
    return;
  }

  console.log('Analyzing mock scan data for:', mockScanData.domain);
  console.log('Open ports:', mockScanData.openPorts.length);
  console.log('Services detected:', mockScanData.services.map(s => `${s.name}:${s.port}`).join(', '));
  console.log('\nPerforming AI-powered analysis...\n');

  try {
    const analysisResult = await analyzeThreats(mockScanData);
    
    console.log('=== AI ANALYSIS RESULTS ===\n');
    console.log(`Total Vulnerabilities Found: ${analysisResult.vulnerabilities.length}`);
    console.log(`Overall Risk Score: ${analysisResult.riskScore}/100`);
    console.log(`Attack Vectors: ${analysisResult.attackVectors.length}`);
    
    if (analysisResult.vulnerabilities.length > 0) {
      console.log('\n--- Top Vulnerabilities ---');
      analysisResult.vulnerabilities.slice(0, 5).forEach((vuln, index) => {
        console.log(`\n${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.title}`);
        console.log(`   Description: ${vuln.description.substring(0, 150)}...`);
        if (vuln.cvssScore) console.log(`   CVSS Score: ${vuln.cvssScore}`);
        if (vuln.cveIds && vuln.cveIds.length > 0) {
          console.log(`   CVE IDs: ${vuln.cveIds.join(', ')}`);
        }
        console.log(`   Remediation: ${vuln.remediation.substring(0, 150)}...`);
      });
    }
    
    if (analysisResult.recommendations.length > 0) {
      console.log('\n--- AI Recommendations ---');
      analysisResult.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    if (analysisResult.attackVectors.length > 0) {
      console.log('\n--- Potential Attack Vectors ---');
      analysisResult.attackVectors.slice(0, 3).forEach((vector, index) => {
        console.log(`${index + 1}. ${vector}`);
      });
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('\nThe AI analysis is working correctly with OpenAI integration!');
    
  } catch (error) {
    console.error('AI Analysis failed:', error);
    console.error('\nPossible issues:');
    console.error('1. Invalid OpenAI API key');
    console.error('2. Network connectivity issues');
    console.error('3. OpenAI API rate limits');
  }
}

// Run the test
testAIAnalysis().catch(console.error);