export function getScanNotificationTemplate({
  name,
  email,
  domain,
  vulnerabilitiesFound,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  scanId,
}: {
  name: string | null;
  email: string;
  domain: string;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scanId: string;
}) {
  const displayName = name || email.split("@")[0];
  const severityColor = criticalCount > 0 ? "#ff0044" : highCount > 0 ? "#ff8800" : "#00ff88";
  const severityText = criticalCount > 0 ? "Critical" : highCount > 0 ? "High" : vulnerabilitiesFound > 0 ? "Medium" : "Secure";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Scan Complete - VulnWatch AI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #00ff88, #0088ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-fill-color: transparent;
      margin-bottom: 10px;
    }
    .content {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      backdrop-filter: blur(10px);
    }
    .scan-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .domain-name {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .scan-status {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      background: ${severityColor}20;
      color: ${severityColor};
      border: 1px solid ${severityColor}40;
    }
    .summary-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .vuln-count {
      font-size: 48px;
      font-weight: bold;
      color: ${severityColor};
      margin-bottom: 10px;
    }
    .vuln-label {
      font-size: 18px;
      color: #a0a0a0;
    }
    .severity-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .severity-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .severity-count {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .severity-name {
      font-size: 12px;
      text-transform: uppercase;
      color: #666666;
    }
    .critical { color: #ff0044; }
    .high { color: #ff8800; }
    .medium { color: #ffcc00; }
    .low { color: #00ff88; }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #00ff88, #0088ff);
      color: #000000;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 20px;
      transition: opacity 0.2s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #e0e0e0;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 14px;
      color: #666666;
    }
    .ai-insights {
      background: rgba(0, 136, 255, 0.1);
      border: 1px solid rgba(0, 136, 255, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .insights-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #0088ff;
    }
    .ai-icon {
      width: 24px;
      height: 24px;
      margin-right: 10px;
      background: linear-gradient(135deg, #00ff88, #0088ff);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">VulnWatch AI</div>
      <p style="color: #666666; margin: 0;">Security Scan Complete</p>
    </div>
    
    <div class="content">
      <div class="scan-header">
        <div class="domain-name">${domain}</div>
        <span class="scan-status">${severityText} Risk</span>
      </div>
      
      <div class="summary-box">
        <div class="vuln-count">${vulnerabilitiesFound}</div>
        <div class="vuln-label">Total Vulnerabilities Found</div>
      </div>
      
      ${vulnerabilitiesFound > 0 ? `
      <div class="severity-grid">
        <div class="severity-item">
          <div class="severity-count critical">${criticalCount}</div>
          <div class="severity-name">Critical</div>
        </div>
        <div class="severity-item">
          <div class="severity-count high">${highCount}</div>
          <div class="severity-name">High</div>
        </div>
        <div class="severity-item">
          <div class="severity-count medium">${mediumCount}</div>
          <div class="severity-name">Medium</div>
        </div>
        <div class="severity-item">
          <div class="severity-count low">${lowCount}</div>
          <div class="severity-name">Low</div>
        </div>
      </div>
      
      <div class="ai-insights">
        <div class="insights-title">
          <div class="ai-icon">✨</div>
          AI-Powered Analysis
        </div>
        <p style="margin: 0; font-size: 14px; color: #e0e0e0;">
          ${criticalCount > 0 
            ? "Critical vulnerabilities detected that require immediate attention. These could lead to system compromise or data breach."
            : highCount > 0 
            ? "High-severity vulnerabilities found that should be addressed promptly to maintain security posture."
            : mediumCount > 0
            ? "Medium-severity issues detected. While not immediately critical, these should be scheduled for remediation."
            : "Only low-severity issues found. Your security posture is good, but addressing these will further harden your system."
          }
        </p>
      </div>
      ` : `
      <div class="message" style="text-align: center;">
        <p style="font-size: 20px; color: #00ff88; margin-bottom: 10px;">✓ No vulnerabilities detected!</p>
        <p>Your domain appears to be secure based on our current scan. We'll continue monitoring for any changes.</p>
      </div>
      `}
      
      <div style="text-align: center;">
        <a href="https://vulnwatch-ai.vercel.app/dashboard/scans/${scanId}" class="button">
          View Detailed Report
        </a>
      </div>
      
      <p class="message" style="margin-top: 30px;">
        Hi ${displayName}, your security scan for <strong>${domain}</strong> has been completed. 
        ${vulnerabilitiesFound > 0 
          ? "We've identified some vulnerabilities that need your attention. Click the button above to view the full report with detailed remediation steps."
          : "Great news! No vulnerabilities were detected in this scan. We'll continue monitoring your domain for any security issues."
        }
      </p>
      
      <p class="message" style="font-size: 14px; color: #666666;">
        Scan ID: ${scanId}<br>
        Completed: ${new Date().toLocaleString()}
      </p>
    </div>
    
    <div class="footer">
      <p>© 2024 VulnWatch AI. All rights reserved.</p>
      <p style="margin-top: 10px; font-size: 12px;">
        You're receiving this because you have an active VulnWatch AI subscription.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}