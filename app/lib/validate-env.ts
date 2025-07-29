// This file validates environment variables on startup
// Import it in your app's entry point to ensure all required variables are set

import { config } from "@/lib/config";

export function validateEnvironment() {
  try {
    // The config import already validates all environment variables
    // If we reach this point, all required variables are set correctly
    
    console.log("✅ Environment validation successful");
    console.log("📧 Email configured for:", config.RESEND_FROM_EMAIL);
    console.log("🌐 App URL:", config.NEXT_PUBLIC_APP_URL);
    console.log("🏃 Running in:", config.NODE_ENV, "mode");
    
    // Additional runtime checks
    if (config.NODE_ENV === "production") {
      // Ensure critical production settings
      if (config.NEXT_PUBLIC_APP_URL.includes("localhost")) {
        console.warn("⚠️  WARNING: Production mode with localhost URL detected!");
      }
      
      if (config.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
        console.warn("⚠️  WARNING: Using test Stripe keys in production!");
      }
      
      if (!config.RESEND_API_KEY || config.RESEND_API_KEY === "re_placeholder") {
        console.error("❌ ERROR: Email service not properly configured for production!");
      }
    }
    
    return true;
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    
    if (config.NODE_ENV === "production") {
      // In production, fail hard if environment is misconfigured
      process.exit(1);
    }
    
    return false;
  }
}

// Auto-validate on import in production
if (config.NODE_ENV === "production") {
  validateEnvironment();
}