import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface DomainSummary {
  domain: string;
  lastScanDate: Date;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  securityScore: number;
  trend: "improved" | "degraded" | "unchanged";
}

interface MonitoringSummaryEmailProps {
  name: string;
  period: "weekly" | "monthly";
  domains: DomainSummary[];
  totalScans: number;
  overallTrend: "improved" | "degraded" | "unchanged";
}

export const MonitoringSummaryEmail = ({
  name = "User",
  period = "weekly",
  domains = [],
  totalScans = 0,
  overallTrend = "unchanged",
}: MonitoringSummaryEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vulnwatch.ai";

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case "improved":
        return "📈";
      case "degraded":
        return "📉";
      default:
        return "➡️";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improved":
        return "#10b981";
      case "degraded":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#ea580c";
    return "#dc2626";
  };

  return (
    <Html>
      <Head />
      <Preview>Your {period} security monitoring summary - {totalScans.toString()} scans completed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="150"
            height="50"
            alt="VulnWatch AI"
            style={logo}
          />
          
          <Heading style={h1}>
            Your {period.charAt(0).toUpperCase() + period.slice(1)} Security Summary
          </Heading>
          
          <Text style={text}>Hello {name},</Text>
          
          <Text style={text}>
            Here's your {period} security monitoring summary. We completed <strong>{totalScans}</strong> automated scans
            across your monitored domains.
          </Text>

          <Section style={overallSection}>
            <Text style={overallTitle}>Overall Security Trend</Text>
            <Text style={overallTrendStyle}>
              <span style={{ fontSize: "24px", marginRight: "8px" }}>{getTrendEmoji(overallTrend)}</span>
              <span style={{ color: getTrendColor(overallTrend), fontWeight: "600" }}>
                {overallTrend.charAt(0).toUpperCase() + overallTrend.slice(1)}
              </span>
            </Text>
          </Section>

          <Heading style={h2}>Domain Summary</Heading>

          {domains.map((domain, index) => (
            <Section key={index} style={domainCard}>
              <div style={domainHeader}>
                <Text style={domainName}>{domain.domain}</Text>
                <Text style={{ ...domainScore, color: getScoreColor(domain.securityScore) }}>
                  Score: {domain.securityScore}/100
                </Text>
              </div>
              
              <div style={statsRow}>
                <div style={statItem}>
                  <Text style={statLabel}>Vulnerabilities</Text>
                  <Text style={statValue}>{domain.vulnerabilityCount}</Text>
                </div>
                <div style={statItem}>
                  <Text style={statLabel}>Critical</Text>
                  <Text style={{ ...statValue, color: "#dc2626" }}>{domain.criticalCount}</Text>
                </div>
                <div style={statItem}>
                  <Text style={statLabel}>High</Text>
                  <Text style={{ ...statValue, color: "#ea580c" }}>{domain.highCount}</Text>
                </div>
                <div style={statItem}>
                  <Text style={statLabel}>Trend</Text>
                  <Text style={statValue}>{getTrendEmoji(domain.trend)}</Text>
                </div>
              </div>
              
              <Text style={lastScan}>
                Last scan: {new Date(domain.lastScanDate).toLocaleDateString()}
              </Text>
            </Section>
          ))}

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${baseUrl}/dashboard`}
            >
              View Detailed Reports
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={tipsSection}>
            <Heading style={h3}>🛡️ Security Tips</Heading>
            <ul style={tipsList}>
              <li style={tipItem}>Keep your software and dependencies up to date</li>
              <li style={tipItem}>Review and fix critical vulnerabilities immediately</li>
              <li style={tipItem}>Enable two-factor authentication where possible</li>
              <li style={tipItem}>Regularly review your SSL certificates</li>
            </ul>
          </Section>

          <Text style={footer}>
            You're receiving this because you have {period} monitoring enabled.
            Manage your preferences in your{" "}
            <Link href={`${baseUrl}/dashboard`} style={link}>
              dashboard settings
            </Link>.
          </Text>

          <Text style={footer}>
            Questions? Contact us at{" "}
            <Link href="mailto:support@vulnwatch.ai" style={link}>
              support@vulnwatch.ai
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MonitoringSummaryEmail;

const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto 32px",
  display: "block",
};

const h1 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "600",
  lineHeight: "36px",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937",
  fontSize: "22px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "32px 0 16px",
};

const h3 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const overallSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const overallTitle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 8px",
};

const overallTrendStyle = {
  fontSize: "20px",
  margin: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const domainCard = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const domainHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const domainName = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
};

const domainScore = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const statsRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const statItem = {
  textAlign: "center" as const,
  flex: "1",
};

const statLabel = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0 0 4px",
};

const statValue = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
};

const lastScan = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const tipsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const tipsList = {
  margin: "0",
  paddingLeft: "20px",
};

const tipItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const link = {
  color: "#10b981",
  textDecoration: "underline",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "16px 0",
  textAlign: "center" as const,
};