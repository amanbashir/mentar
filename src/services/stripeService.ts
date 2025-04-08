import { supabase } from '../lib/supabaseClient';

// Use relative paths for Netlify functions
const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // In production, use relative paths
  : 'http://localhost:8888'; // Use Netlify dev server port

export interface CheckoutSession {
  id: string;
  url: string;
}

export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> => {
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    console.log('Creating checkout session with:', {
      priceId,
      userId: session.user.id,
      userEmail: session.user.email,
      successUrl,
      cancelUrl,
    });

    // Create a checkout session on your backend
    const response = await fetch(`${API_URL}/.netlify/functions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId: session.user.id,
        userEmail: session.user.email,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Checkout session error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to create checkout session');
      } catch (e) {
        throw new Error(`Failed to create checkout session: ${errorText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async (): Promise<string> => {
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return 'none';
    }

    // Fetch subscription status from your backend
    const response = await fetch(`${API_URL}/.netlify/functions/subscription-status?userId=${session.user.id}`);

    if (!response.ok) {
      console.error('Error fetching subscription status:', await response.text());
      return 'none';
    }

    const data = await response.json();
    return data.status || 'none';
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return 'none';
  }
}; 