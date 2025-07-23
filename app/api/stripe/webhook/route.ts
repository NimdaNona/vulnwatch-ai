import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing, we need the raw body for webhook verification
export const runtime = "nodejs";

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Payment successful for session:", session.id);
  
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const planId = session.metadata?.plan_id;
  const subscriptionId = session.subscription;

  // In a real implementation, you would:
  // 1. Create or update user account in your database
  // 2. Store the subscription ID for future reference
  // 3. Grant access to the purchased plan
  // 4. Send welcome email
  
  // For MVP, we'll just log the information
  console.log("New subscription created:", {
    email: customerEmail,
    name: customerName,
    plan: planId,
    subscriptionId: subscriptionId,
  });

  // Here you could store in a database or external service
  // For now, we'll just log it
  if (customerEmail) {
    console.log(`Would send welcome email to ${customerEmail}`);
    console.log(`Would provision ${planId} resources for ${customerName}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);
  
  // Handle subscription updates (upgrades, downgrades, cancellations)
  const status = subscription.status;
  const customerId = subscription.customer;
  
  if (status === "canceled") {
    console.log("Subscription canceled for customer:", customerId);
    // Handle cancellation logic
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case "customer.subscription.created":
        console.log("Subscription created:", event.data.object);
        break;
      
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case "customer.subscription.deleted":
        console.log("Subscription deleted:", event.data.object);
        break;
      
      case "invoice.payment_succeeded":
        console.log("Invoice payment succeeded:", event.data.object);
        break;
      
      case "invoice.payment_failed":
        console.log("Invoice payment failed:", event.data.object);
        // Handle failed payment (send email, retry, etc.)
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}