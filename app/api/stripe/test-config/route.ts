import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    // Check if key exists
    if (!stripeKey) {
      return NextResponse.json({
        error: "STRIPE_SECRET_KEY not found in environment",
        hasKey: false,
      }, { status: 500 });
    }
    
    // Check key format
    const keyInfo = {
      hasKey: true,
      keyLength: stripeKey.length,
      keyPrefix: stripeKey.substring(0, 7),
      keyEndsWithTest: stripeKey.includes("test"),
      hasInvalidChars: /[\s\n\r\t]/.test(stripeKey),
      hasNonAscii: /[^\x00-\x7F]/.test(stripeKey),
    };
    
    // Try to initialize Stripe
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2025-06-30.basil",
      });
      
      // Try a simple API call
      const { data: prices } = await stripe.prices.list({ limit: 1 });
      
      return NextResponse.json({
        success: true,
        keyInfo,
        stripeConnected: true,
        pricesFound: prices.length,
      });
    } catch (stripeError: any) {
      return NextResponse.json({
        error: "Stripe initialization failed",
        keyInfo,
        stripeError: stripeError.message,
        stripeErrorType: stripeError.type,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message,
    }, { status: 500 });
  }
}