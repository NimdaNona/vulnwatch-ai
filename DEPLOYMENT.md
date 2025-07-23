# VulnWatch AI - Deployment Guide

This guide covers deploying VulnWatch AI to Vercel with Stripe integration.

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [Stripe Account](https://dashboard.stripe.com/register)
3. [GitHub Account](https://github.com)
4. Node.js 18+ installed locally

## Deployment Steps

### 1. Prepare Your Stripe Account

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Create recurring monthly prices for your products:
   - **VulnWatch Starter**: $49/month
   - **VulnWatch Pro**: $297/month
3. Note down the Price IDs (they start with `price_`)
4. Get your API keys from [Stripe API Keys](https://dashboard.stripe.com/apikeys)
5. Set up your webhook endpoint (we'll get the URL after deployment)

### 2. Prepare Your Repository

```bash
# Add all files to git
git add .

# Commit your changes
git commit -m "Initial commit: VulnWatch AI MVP"

# Create a new repository on GitHub
# Then push your code:
git remote add origin https://github.com/YOUR_USERNAME/vulnwatch-ai.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel:

```env
# Required Environment Variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_STARTER=price_your_starter_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id
```

5. Click "Deploy"

### 4. Configure Stripe Webhooks

1. After deployment, get your production URL (e.g., `https://vulnwatch-ai.vercel.app`)
2. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
3. Click "Add endpoint"
4. Enter endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
5. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Copy the webhook signing secret
7. Update the `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

### 5. Test Your Deployment

1. Visit your deployed site
2. Test the checkout flow with [Stripe test cards](https://stripe.com/docs/testing)
3. Verify webhooks are being received in Stripe Dashboard

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_ID_STARTER` | Price ID for Starter plan | `price_...` |
| `STRIPE_PRICE_ID_PRO` | Price ID for Pro plan | `price_...` |

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test checkout flow with a test card
- [ ] Verify webhook events are being received
- [ ] Check that subscription mode is working (14-day trial)
- [ ] Test success and cancel pages
- [ ] Monitor Vercel Functions logs for any errors

## Troubleshooting

### Checkout Session Fails
- Check that Price IDs are correct in environment variables
- Verify Stripe keys are for the correct mode (test/live)
- Check Vercel Functions logs for detailed errors

### Webhooks Not Working
- Verify webhook endpoint URL is correct
- Check webhook signing secret matches
- Ensure selected events include necessary subscription events
- Check Vercel Functions logs for webhook processing

### CORS Issues
- The `vercel.json` includes CORS headers
- For custom domains, update allowed origins if needed

## Next Steps

1. **Set up a database** to store user subscriptions
2. **Implement user authentication** with Clerk or NextAuth
3. **Add customer portal** for subscription management
4. **Set up monitoring** with Vercel Analytics
5. **Configure custom domain** in Vercel settings

## Security Notes

- Never commit `.env.local` files
- Use Vercel environment variables for production
- Regularly rotate API keys
- Monitor Stripe webhook logs for suspicious activity
- Enable Stripe Radar for fraud protection

## Support

For deployment issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ by VulnWatch AI Team