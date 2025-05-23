import { loadStripe } from '@stripe/stripe-js';

// Use the static Stripe publishable key
const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY || '');

export default stripePromise; 