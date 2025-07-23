import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing, we need the raw body for webhook verification
export const runtime = "nodejs";

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Payment successful for session:", session.id);
  
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const planId = session.metadata?.plan_id;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!customerEmail) {
    console.error("No customer email found in session");
    return;
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    let temporaryPassword: string | undefined;
    let hashedPassword: string | undefined;

    // Generate temporary password only for new users
    if (!existingUser) {
      temporaryPassword = crypto.randomBytes(8).toString("hex");
      hashedPassword = await hashPassword(temporaryPassword);
    }

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { email: customerEmail },
      create: {
        email: customerEmail,
        name: customerName || undefined,
        password: hashedPassword,
        stripeCustomerId: customerId,
        subscriptionId: subscriptionId,
        subscriptionStatus: "active",
        subscriptionPlan: planId,
      },
      update: {
        name: customerName || undefined,
        stripeCustomerId: customerId,
        subscriptionId: subscriptionId,
        subscriptionStatus: "active",
        subscriptionPlan: planId,
      },
    });

    console.log("User created/updated:", user.id);

    // Send welcome email with temporary password for new users
    if (temporaryPassword) {
      try {
        await sendWelcomeEmail(
          customerEmail,
          customerName || null,
          temporaryPassword
        );
        console.log("Welcome email sent to:", customerEmail);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't throw - user is already created, just log the error
      }
    }

    // TODO: Provision resources based on plan
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);
  
  const status = subscription.status;
  const customerId = subscription.customer as string;
  const planId = subscription.items.data[0]?.price.metadata?.plan_id || 
                 subscription.metadata?.plan_id;

  try {
    // Update user subscription status in database
    const user = await prisma.user.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: status,
        subscriptionPlan: status === "canceled" ? null : planId,
      },
    });

    console.log(`Subscription ${status} for user:`, user.id);
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
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