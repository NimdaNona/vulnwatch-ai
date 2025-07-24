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
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log("Email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Email service error:", error);
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