# Stripe Integration Guide

This guide will help you set up Stripe integration for the MentarAI application.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com) if you don't have one)
2. A Supabase project
3. Node.js and npm installed

## Setup Steps

### 1. Create Products and Prices in Stripe

1. Log in to your Stripe Dashboard
2. Go to Products > Add Product
3. Create two products:
   - **Pro Monthly**: Set the price to $29/month
   - **Pro Annually**: Set the price to $197/year (with a 43% discount)
4. Note down the Price IDs for each product (they start with `price_`)

### 2. Set Up Environment Variables

#### For the React App

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_API_URL=http://localhost:3001
```

#### For the Server

Create a `.env` file in the `server` directory with the following variables:

```
PORT=3001
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Update Price IDs in the Settings Component

In `src/pages/Settings/Settings.tsx`, replace the placeholder price IDs with your actual Stripe Price IDs:

```typescript
// Replace these with your actual Stripe Price IDs
onClick={() => handleUpgrade('price_monthly_id')} // For monthly plan
onClick={() => handleUpgrade('price_annual_id')} // For annual plan
```

### 4. Set Up Stripe Webhook

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the Webhook Signing Secret and add it to your server's `.env` file

### 5. Run Database Migrations

Run the Supabase migrations to create the subscriptions table:

```bash
cd supabase
npx supabase db reset
```

### 6. Start the Server

```bash
cd server
npm install
npm start
```

### 7. Start the React App

```bash
npm start
```

## Testing the Integration

1. Go to the Settings page in your app
2. Click on "Upgrade" for either the monthly or annual plan
3. You should be redirected to the Stripe Checkout page
4. Use Stripe's test card numbers to complete the checkout:
   - `4242 4242 4242 4242` for successful payments
   - `4000 0000 0000 9995` for failed payments
5. After successful payment, you should be redirected back to your app
6. The subscription status should be updated in the UI

## Troubleshooting

- If the checkout doesn't work, check the browser console for errors
- If webhook events aren't being processed, check the server logs
- Make sure your Stripe API keys are correct and have the right permissions
- Ensure your Supabase service role key has the necessary permissions

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Documentation](https://supabase.io/docs) 