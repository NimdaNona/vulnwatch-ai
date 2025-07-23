import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: "demo@vulnwatch.ai",
      name: "Demo User",
      stripeCustomerId: "cus_demo123",
      subscriptionStatus: "active",
      subscriptionId: "sub_demo123",
      subscriptionPlan: "pro",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "trial@vulnwatch.ai",
      name: "Trial User",
      stripeCustomerId: "cus_trial456",
      subscriptionStatus: "trialing",
      subscriptionId: "sub_trial456",
      subscriptionPlan: "starter",
    },
  });

  // Create sample scans
  const scan1 = await prisma.scan.create({
    data: {
      userId: user1.id,
      targetUrl: "https://example.com",
      status: "completed",
      completedAt: new Date(),
      results: {
        summary: "Found 3 vulnerabilities",
        totalVulnerabilities: 3,
        criticalCount: 1,
        highCount: 1,
        mediumCount: 1,
      },
    },
  });

  const scan2 = await prisma.scan.create({
    data: {
      userId: user1.id,
      targetUrl: "https://test.example.com",
      status: "running",
    },
  });

  // Create sample vulnerabilities
  await prisma.vulnerability.createMany({
    data: [
      {
        scanId: scan1.id,
        severity: "critical",
        title: "SQL Injection Vulnerability",
        description: "SQL injection vulnerability found in login form parameter 'username'",
        cve: "CVE-2021-44228",
        cvss: 9.8,
        affected: "/login",
        solution: "Implement parameterized queries and input validation",
        aiAnalysis: {
          risk: "This vulnerability allows attackers to execute arbitrary SQL commands",
          recommendation: "Use prepared statements and validate all user inputs",
          priority: "immediate",
        },
      },
      {
        scanId: scan1.id,
        severity: "high",
        title: "Cross-Site Scripting (XSS)",
        description: "Reflected XSS vulnerability in search functionality",
        cve: "CVE-2022-23812",
        cvss: 7.5,
        affected: "/search?q=",
        solution: "Encode all user inputs before displaying in HTML",
        aiAnalysis: {
          risk: "Attackers can inject malicious scripts to steal user data",
          recommendation: "Implement proper output encoding and Content Security Policy",
          priority: "high",
        },
      },
      {
        scanId: scan1.id,
        severity: "medium",
        title: "Outdated jQuery Version",
        description: "jQuery version 2.1.4 has known security vulnerabilities",
        cve: "CVE-2019-11358",
        cvss: 6.1,
        affected: "/js/jquery-2.1.4.min.js",
        solution: "Update to jQuery 3.6.0 or later",
        aiAnalysis: {
          risk: "Outdated library with known prototype pollution vulnerability",
          recommendation: "Update to latest stable version and review dependencies regularly",
          priority: "medium",
        },
      },
    ],
  });

  console.log("✅ Seed completed!");
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.scan.count()} scans`);
  console.log(`Created ${await prisma.vulnerability.count()} vulnerabilities`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });