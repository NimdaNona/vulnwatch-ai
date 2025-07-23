"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

interface StripeCheckoutProps {
  planId: "starter" | "pro" | "enterprise";
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function StripeCheckout({ 
  planId, 
  children, 
  className,
  variant = "default" 
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // Call our Next.js API route to create checkout session
      const response = await fetch(
        `/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: planId,
            success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/checkout/cancel`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { session_url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = session_url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't show checkout for enterprise plan
  if (planId === "enterprise") {
    return (
      <Button className={className} variant={variant} disabled>
        Contact Sales
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {children || "Get Started"}
          {!children && <ArrowRightIcon className="ml-2 h-4 w-4" />}
        </>
      )}
    </Button>
  );
}