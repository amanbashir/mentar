import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// Use the Stripe test key from the environment file
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY || '');

// Base URL for serverless functions
const API_URL = process.env.NODE_ENV === 'production'
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

export interface CheckoutSession {
  id: string;
  url?: string;
  priceId?: string;
}

// Helper function to add random retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a random delay for exponential backoff with jitter
const getRetryDelay = (retryCount: number, baseDelay = 1000, maxDelay = 10000) => {
  // Exponential backoff: 2^retry * baseDelay
  const expBackoff = Math.min(maxDelay, Math.pow(2, retryCount) * baseDelay);
  // Add jitter: random amount between 0 and expBackoff/2
  const jitter = Math.random() * (expBackoff / 2);
  return expBackoff + jitter;
};

/**
 * Creates a Stripe checkout session and returns the session URL
 */
export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> => {
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating checkout session with price ID:', priceId);
      
      // Add price_id parameter to success URL for tracking
      const enhancedSuccessUrl = new URL(successUrl);
      enhancedSuccessUrl.searchParams.append('price_id', priceId);
      
      // Call the Netlify function directly
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
          successUrl: enhancedSuccessUrl.toString(),
          cancelUrl,
        }),
      });

      // Check if response is valid
      if (!response) {
        throw new Error('Network response was not returned');
      }

      // If response is not ok, handle the error
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText.substring(0, 100)}`);
        }
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error('Invalid response from server');
      }

      console.log('Checkout session created successfully:', data.id);
      return {
        id: data.id,
        url: data.url,
        priceId: data.priceId
      };
    } catch (error) {
      console.error(`Error creating checkout session (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      // If we've used all retries, throw the error
      if (retries === maxRetries) {
        throw error;
      }
      
      // Add a dynamic delay before retrying
      const delay = getRetryDelay(retries);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      
      retries++;
    }
  }
  
  // This should never be reached, but TypeScript needs a return
  throw new Error('Failed to create checkout session after retries');
};

/**
 * Redirects the user to the Stripe checkout page
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  try {
    console.log('Redirecting to checkout with session ID:', sessionId);
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message || 'Failed to redirect to checkout');
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return 'none';
    }

    console.log('Fetching subscription status for user:', session.user.id);
    
    // Call the Netlify function to get subscription status
    const response = await fetch(`${API_URL}/subscription-status?userId=${session.user.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to get subscription status:', response.status, response.statusText);
      return 'none';
    }

    try {
      const data = await response.json();
      console.log('Subscription status response:', data);
      return data.status || 'none';
    } catch (e) {
      console.error('Failed to parse subscription status:', e);
      return 'none';
    }
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return 'none';
  }
};