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
} from "@react-email/components";
import { ScanComparison } from "@/lib/monitoring/scan-comparison";

interface MonitoringAlertEmailProps {
  name: string;
  domain: string;
  comparison: ScanComparison;
  scanId: string;
  summary: string;
}

export const MonitoringAlertEmail = ({
  name = "User",
  domain = "example.com",
  comparison,
  scanId,
  summary,
}: MonitoringAlertEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vulnwatch.ai";
  const scanUrl = `${baseUrl}/dashboard/scan/${scanId}`;

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "improved":
        return "✅";
      case "degraded":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Security Alert for {domain} - {summary}</Preview>
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
            {getStatusEmoji(comparison.summary.overallStatus)} Security Alert for {domain}
          </Heading>
          
          <Text style={text}>Hello {name},</Text>
          
          <Text style={text}>
            Your scheduled security scan for <strong>{domain}</strong> has completed with changes detected.
          </Text>

          <Section style={summaryBox}>
            <Text style={summaryText}>{summary}</Text>
          </Section>

          {comparison.summary.totalNew > 0 && (
            <Section style={section}>
              <Heading style={h2}>🚨 New Vulnerabilities Found</Heading>
              {comparison.newVulnerabilities.slice(0, 5).map((vuln, index) => (
                <div key={index} style={vulnItem}>
                  <Text style={vulnTitle}>
                    <span style={{ color: getSeverityColor(vuln.severity) }}>
                      [{vuln.severity}]
                    </span>{" "}
                    {vuln.title}
                  </Text>
                  <Text style={vulnDescription}>{vuln.description}</Text>
                </div>
              ))}
              {comparison.newVulnerabilities.length > 5 && (
                <Text style={moreText}>
                  ...and {comparison.newVulnerabilities.length - 5} more
                </Text>
              )}
            </Section>
          )}

          {comparison.summary.totalResolved > 0 && (
            <Section style={section}>
              <Heading style={h2}>✅ Resolved Vulnerabilities</Heading>
              <Text style={text}>
                Great news! {comparison.summary.totalResolved} vulnerabilities have been resolved since your last scan.
              </Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={scanUrl}
            >
              View Full Scan Results
            </Button>
          </Section>

          <Section style={statsSection}>
            <Text style={statsTitle}>Security Score Change</Text>
            <Text style={scoreChange}>
              {comparison.securityScoreDelta > 0 ? "+" : ""}{comparison.securityScoreDelta} points
            </Text>
          </Section>

          <Text style={footer}>
            This automated scan was performed as part of your monitoring schedule.
            You can adjust your monitoring preferences in your{" "}
            <Link href={`${baseUrl}/dashboard`} style={link}>
              dashboard settings
            </Link>.
          </Text>

          <Text style={footer}>
            Need help? Contact our support team at{" "}
            <Link href="mailto:support@vulnwatch.ai" style={link}>
              support@vulnwatch.ai
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MonitoringAlertEmail;

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
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "24px 0 16px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const section = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const summaryBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const summaryText = {
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  fontWeight: "500",
};

const vulnItem = {
  marginBottom: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid #e5e7eb",
};

const vulnTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 4px",
};

const vulnDescription = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "20px",
};

const moreText = {
  fontSize: "14px",
  color: "#6b7280",
  fontStyle: "italic",
  margin: "8px 0",
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

const statsSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
};

const statsTitle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 8px",
};

const scoreChange = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#10b981",
  margin: "0",
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