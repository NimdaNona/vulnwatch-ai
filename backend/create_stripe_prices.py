import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set your Stripe secret key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_monthly_prices():
    """Create monthly recurring prices for VulnWatch products"""
    
    # Create Starter monthly price ($49/month)
    starter_price = stripe.Price.create(
        product="prod_SjVguS0Jo2vvQC",  # VulnWatch Starter product ID
        unit_amount=4900,  # $49.00 in cents
        currency="usd",
        recurring={"interval": "month"},
        nickname="Starter Monthly"
    )
    print(f"Created Starter monthly price: {starter_price.id}")
    
    # Create Pro monthly price ($297/month)
    pro_price = stripe.Price.create(
        product="prod_SjVgD9wQvJ89mk",  # VulnWatch Pro product ID
        unit_amount=29700,  # $297.00 in cents
        currency="usd",
        recurring={"interval": "month"},
        nickname="Pro Monthly"
    )
    print(f"Created Pro monthly price: {pro_price.id}")
    
    return starter_price.id, pro_price.id

if __name__ == "__main__":
    starter_price_id, pro_price_id = create_monthly_prices()
    print(f"\nAdd these to your .env file:")
    print(f"STRIPE_PRICE_ID_STARTER={starter_price_id}")
    print(f"STRIPE_PRICE_ID_PRO={pro_price_id}")