import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = "VulnWatch AI <noreply@vulnwatch.ai>",
}: SendEmailOptions) {
  try {
    // Skip email sending if no API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
      console.log("Email service not configured, skipping email:", { to, subject });
      return { id: "skipped", message: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      // Check for domain verification error
      if (error.message?.includes("domain is not verified")) {
        console.warn("Email domain not verified. Skipping email send.");
        return { id: "skipped", message: "Domain not verified" };
      }
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log("Email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Email service error:", error);
    // Don't fail critical operations due to email issues
    if (error instanceof Error && error.message.includes("domain is not verified")) {
      return { id: "skipped", message: "Domain not verified" };
    }
    throw error;
  }
}

// Specific email functions
export async function sendWelcomeEmail(
  email: string,
  name: string | null,
  temporaryPassword: string
) {
  const { getWelcomeEmailTemplate } = await import("./email-templates/welcome");
  const html = getWelcomeEmailTemplate({ name, email, temporaryPassword });

  return sendEmail({
    to: email,
    subject: "Welcome to VulnWatch AI - Your Account is Ready",
    html,
  });
}

export async function sendScanNotificationEmail(
  email: string,
  name: string | null,
  scanDetails: {
    domain: string;
    vulnerabilitiesFound: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    scanId: string;
  }
) {
  const { getScanNotificationTemplate } = await import("./email-templates/scan-notification");
  const html = getScanNotificationTemplate({ name, email, ...scanDetails });

  return sendEmail({
    to: email,
    subject: `Security Scan Complete for ${scanDetails.domain}`,
    html,
  });
}

export async function sendMonitoringAlertEmail(
  email: string,
  name: string,
  alertDetails: {
    domain: string;
    comparison: any; // ScanComparison type
    scanId: string;
    summary: string;
  }
) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const MonitoringAlertEmail = (await import("@/components/emails/monitoring-alert")).default;
  
  const emailHtml = renderToStaticMarkup(
    MonitoringAlertEmail({
      name,
      domain: alertDetails.domain,
      comparison: alertDetails.comparison,
      scanId: alertDetails.scanId,
      summary: alertDetails.summary,
    })
  );

  return sendEmail({
    to: email,
    subject: `🔔 Security Alert for ${alertDetails.domain}`,
    html: emailHtml,
  });
}

export async function sendMonitoringSummaryEmail(
  email: string,
  name: string,
  summaryDetails: {
    period: "weekly" | "monthly";
    domains: Array<{
      domain: string;
      lastScanDate: Date;
      vulnerabilityCount: number;
      criticalCount: number;
      highCount: number;
      securityScore: number;
      trend: "improved" | "degraded" | "unchanged";
    }>;
    totalScans: number;
    overallTrend: "improved" | "degraded" | "unchanged";
  }
) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const MonitoringSummaryEmail = (await import("@/components/emails/monitoring-summary")).default;
  
  const emailHtml = renderToStaticMarkup(
    MonitoringSummaryEmail({
      name,
      period: summaryDetails.period,
      domains: summaryDetails.domains,
      totalScans: summaryDetails.totalScans,
      overallTrend: summaryDetails.overallTrend,
    })
  );

  return sendEmail({
    to: email,
    subject: `Your ${summaryDetails.period} security monitoring summary`,
    html: emailHtml,
  });
}