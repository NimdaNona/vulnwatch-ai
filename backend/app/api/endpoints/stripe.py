from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import stripe
import os
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_dummy")

# Get price IDs from environment
PRICE_IDS = {
    "starter": os.getenv("STRIPE_PRICE_ID_STARTER", "price_1Ro2f3G48MbDPfJlTaEBFcWX"),
    "pro": os.getenv("STRIPE_PRICE_ID_PRO", "price_1Ro2fDG48MbDPfJlXoXHL7VQ"),
}

# Webhook secret for verifying Stripe webhooks
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_dummy")


class CreateCheckoutSessionRequest(BaseModel):
    plan_id: str
    success_url: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    session_url: str
    session_id: str


@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(request: CreateCheckoutSessionRequest):
    """
    Create a Stripe checkout session for subscription signup
    """
    try:
        # Validate plan_id
        if request.plan_id not in PRICE_IDS:
            raise HTTPException(status_code=400, detail=f"Invalid plan_id: {request.plan_id}")
        
        price_id = PRICE_IDS[request.plan_id]
        
        # Create Stripe checkout session
        # Note: In production, we'd create recurring subscriptions
        # For now, using one-time payments as the MCP doesn't support creating recurring prices
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="payment",  # Would be "subscription" for recurring
            success_url=request.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            customer_email=None,  # Let Stripe collect email
            billing_address_collection="required",
            # metadata for tracking
            metadata={
                "plan_id": request.plan_id,
                "product": f"vulnwatch_{request.plan_id}",
            }
        )
        
        logger.info(f"Created checkout session: {checkout_session.id}")
        
        return CreateCheckoutSessionResponse(
            session_url=checkout_session.url,
            session_id=checkout_session.id
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None)
):
    """
    Handle Stripe webhook events
    """
    try:
        # Get the webhook payload
        payload = await request.body()
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            # Invalid payload
            logger.error("Invalid webhook payload")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            # Invalid signature
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            
            # Handle successful payment
            await handle_successful_payment(session)
            
            logger.info(f"Payment successful for session: {session['id']}")
            
        elif event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            logger.info(f"Subscription created: {subscription['id']}")
            
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            logger.info(f"Subscription updated: {subscription['id']}")
            
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            logger.info(f"Subscription cancelled: {subscription['id']}")
        
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def handle_successful_payment(session):
    """
    Handle successful payment/subscription
    """
    # Extract customer info
    customer_email = session.get("customer_details", {}).get("email")
    customer_name = session.get("customer_details", {}).get("name")
    plan_id = session.get("metadata", {}).get("plan_id")
    
    logger.info(f"Processing payment for {customer_email} - Plan: {plan_id}")
    
    # In a real implementation, you would:
    # 1. Create or update user account
    # 2. Grant access to the purchased plan
    # 3. Send welcome email
    # 4. Set up scanner infrastructure
    
    # Mock implementation
    if customer_email:
        logger.info(f"Would send welcome email to {customer_email}")
        logger.info(f"Would provision {plan_id} resources for {customer_name}")
    
    return True


@router.get("/config")
async def get_stripe_config():
    """
    Get Stripe publishable key for frontend
    """
    return {
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_dummy"),
        "prices": {
            "starter": {
                "price_id": PRICE_IDS["starter"],
                "amount": 4900,
                "currency": "usd",
                "interval": "month"
            },
            "pro": {
                "price_id": PRICE_IDS["pro"],
                "amount": 29700,
                "currency": "usd",
                "interval": "month"
            }
        }
    }