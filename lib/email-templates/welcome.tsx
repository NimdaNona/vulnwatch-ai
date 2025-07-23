export function getWelcomeEmailTemplate({
  name,
  email,
  temporaryPassword,
}: {
  name: string | null;
  email: string;
  temporaryPassword: string;
}) {
  const displayName = name || email.split("@")[0];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VulnWatch AI</title>
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
    .greeting {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #e0e0e0;
      margin-bottom: 30px;
    }
    .credentials-box {
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid rgba(0, 255, 136, 0.3);
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
    }
    .credential-item {
      margin: 15px 0;
    }
    .credential-label {
      font-size: 14px;
      color: #a0a0a0;
      margin-bottom: 5px;
    }
    .credential-value {
      font-size: 18px;
      font-weight: 600;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 15px;
      border-radius: 8px;
      border: 1px solid rgba(0, 255, 136, 0.2);
      display: inline-block;
      margin-top: 5px;
    }
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
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 14px;
      color: #666666;
    }
    .security-note {
      background: rgba(255, 200, 0, 0.1);
      border: 1px solid rgba(255, 200, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin-top: 30px;
      font-size: 14px;
      color: #ffc800;
    }
    .feature-list {
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin: 15px 0;
    }
    .feature-icon {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #00ff88, #0088ff);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .checkmark {
      color: #000000;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">VulnWatch AI</div>
      <p style="color: #666666; margin: 0;">Advanced Vulnerability Scanning</p>
    </div>
    
    <div class="content">
      <h1 class="greeting">Welcome to VulnWatch AI, ${displayName}!</h1>
      
      <p class="message">
        Your subscription has been successfully activated. You now have full access to our advanced vulnerability scanning platform.
      </p>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #ffffff;">Your Login Credentials</h3>
        
        <div class="credential-item">
          <div class="credential-label">Email</div>
          <div class="credential-value">${email}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Temporary Password</div>
          <div class="credential-value">${temporaryPassword}</div>
        </div>
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Notice:</strong> Please change your password immediately after your first login for security purposes.
      </div>
      
      <div class="feature-list">
        <h3 style="color: #ffffff;">What you can do now:</h3>
        
        <div class="feature-item">
          <div class="feature-icon">
            <span class="checkmark">✓</span>
          </div>
          <span>Scan unlimited domains for vulnerabilities</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">
            <span class="checkmark">✓</span>
          </div>
          <span>Get AI-powered threat analysis and recommendations</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">
            <span class="checkmark">✓</span>
          </div>
          <span>Receive real-time alerts for critical vulnerabilities</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">
            <span class="checkmark">✓</span>
          </div>
          <span>Access detailed security reports and history</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://vulnwatch-ai.vercel.app/login" class="button">
          Login to Dashboard
        </a>
      </div>
      
      <p class="message" style="margin-top: 30px;">
        If you have any questions or need assistance, our support team is here to help. Simply reply to this email or visit our help center.
      </p>
    </div>
    
    <div class="footer">
      <p>© 2024 VulnWatch AI. All rights reserved.</p>
      <p style="margin-top: 10px; font-size: 12px;">
        You're receiving this email because you signed up for VulnWatch AI.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}