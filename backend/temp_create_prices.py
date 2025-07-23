"""
Temporary script to create Stripe prices using the MCP server.
This generates the correct price configuration for the Stripe MCP.
"""

# Since we can't create recurring prices directly through the MCP, 
# we'll need to use the Stripe Dashboard or API directly.

# For now, let's use the one-time prices we created and update our backend to handle them
# The price IDs we'll use are:
# Starter: price_1Ro2f3G48MbDPfJlTaEBFcWX ($49 one-time)
# Pro: price_1Ro2fDG48MbDPfJlXoXHL7VQ ($297 one-time)

print("One-time price IDs created:")
print("STRIPE_PRICE_ID_STARTER=price_1Ro2f3G48MbDPfJlTaEBFcWX")
print("STRIPE_PRICE_ID_PRO=price_1Ro2fDG48MbDPfJlXoXHL7VQ")