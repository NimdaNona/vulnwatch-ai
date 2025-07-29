import { z } from "zod";

// Define the configuration schema
const configSchema = z.object({
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Authentication
  JWT_SECRET_KEY: z.string().min(32),
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRICE_ID_STARTER: z.string().startsWith("price_"),
  STRIPE_PRICE_ID_PRO: z.string().startsWith("price_"),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().startsWith("price_"),
  
  // Resend Email Configuration
  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string().email().default("noreply@vulnwatch.app"),
  RESEND_FROM_NAME: z.string().default("VulnWatch"),
  
  // Scanner Configuration
  SCANNER_CONCURRENT_SCANS: z.string().transform(Number).pipe(z.number().positive()).default("2"),
  SCANNER_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().positive()).default("300000"),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_STRIPE: z.string().transform(val => val === "true").default("true"),
  NEXT_PUBLIC_ENABLE_MONITORING: z.string().transform(val => val === "true").default("true"),
  
  // Monitoring Configuration
  MONITORING_BATCH_SIZE: z.string().transform(Number).pipe(z.number().positive()).default("5"),
  
  // Cron Configuration
  CRON_SECRET: z.string().min(1),
  
  // OpenAI Configuration (optional)
  OPENAI_API_KEY: z.string().optional(),
  
  // Vercel Configuration (optional)
  VERCEL_URL: z.string().optional(),
});

// Parse and validate environment variables
const parseConfig = () => {
  try {
    const config = configSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      
      // In production, fail hard if configuration is invalid
      if (process.env.NODE_ENV === "production") {
        throw new Error("Invalid environment configuration");
      }
    }
    throw error;
  }
};

// Export the validated configuration
export const config = parseConfig();

// Export type for the configuration
export type Config = z.infer<typeof configSchema>;

// Helper functions to check environment
export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";

// Helper to get the app URL (handles Vercel deployments)
export const getAppUrl = () => {
  if (config.NEXT_PUBLIC_APP_URL !== "http://localhost:3000") {
    return config.NEXT_PUBLIC_APP_URL;
  }
  
  if (config.VERCEL_URL) {
    return `https://${config.VERCEL_URL}`;
  }
  
  return config.NEXT_PUBLIC_APP_URL;
};

// Helper to get base email configuration
export const getEmailConfig = () => ({
  from: `${config.RESEND_FROM_NAME} <${config.RESEND_FROM_EMAIL}>`,
  apiKey: config.RESEND_API_KEY,
});

// Helper to get Stripe configuration
export const getStripeConfig = () => ({
  secretKey: config.STRIPE_SECRET_KEY,
  webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  prices: {
    starter: config.STRIPE_PRICE_ID_STARTER,
    pro: config.STRIPE_PRICE_ID_PRO,
    enterprise: config.STRIPE_PRICE_ID_ENTERPRISE,
  },
});

// Log successful configuration load
if (!isTest) {
  console.log("✅ Environment configuration validated successfully");
}