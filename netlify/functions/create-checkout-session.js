import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Log environment variables (without sensitive values)
console.log('Environment check:');
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check for required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is missing');
}

if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL is missing');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

// Initialize Stripe client
let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.error('Error initializing Stripe client:', error);
}

// Initialize Supabase client
let supabase;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } else {
    console.error('Cannot initialize Supabase client: missing environment variables');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

export const handler = async (event, context) => {
  console.log('Function invoked with method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  // Check if required clients are initialized
  if (!stripe) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Stripe client not initialized. Check environment variables.' }),
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { priceId, userId, userEmail, successUrl, cancelUrl } = body;

    if (!priceId || !userId || !userEmail) {
      console.error('Missing required parameters:', { priceId, userId, userEmail });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters' }),
      };
    }

    console.log('Creating Stripe checkout session with:', {
      priceId,
      userId,
      userEmail,
      successUrl,
      cancelUrl,
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    console.log('Checkout session created successfully:', session.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
}; 