import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { config, getStripeConfig, getAppUrl } from "@/lib/config";

// Initialize Stripe with centralized config
const stripeConfig = getStripeConfig();
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: "2025-06-30.basil",
});

// Price IDs from centralized config
const PRICE_IDS = stripeConfig.prices;

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe is properly initialized
    if (!stripeConfig.secretKey || stripeConfig.secretKey.length === 0) {
      console.error("Stripe key is empty or invalid");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    const { plan_id, success_url, cancel_url } = await request.json();

    // Validate plan_id
    if (!plan_id || !(plan_id in PRICE_IDS)) {
      return NextResponse.json(
        { error: `Invalid plan_id: ${plan_id}` },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan_id as keyof typeof PRICE_IDS];

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription", // Changed from "payment" to "subscription"
      success_url: success_url,
      cancel_url: cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_email: undefined, // Let Stripe collect email
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          plan_id: plan_id,
        },
      },
      metadata: {
        plan_id: plan_id,
        product: `vulnwatch_${plan_id}`,
      },
    });

    return NextResponse.json({
      session_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}