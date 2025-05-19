import { createClient } from '@supabase/supabase-js';

// Log environment variables (without sensitive values)
console.log('Environment check:');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check for required environment variables
if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL is missing');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
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
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  // Check if Supabase client is initialized
  if (!supabase) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Supabase client not initialized. Check environment variables.' }),
    };
  }

  try {
    // Get the userId from query parameters
    const userId = event.queryStringParameters?.userId;
    console.log('Query parameters:', event.queryStringParameters);

    if (!userId) {
      console.error('Missing userId parameter');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User ID is required' }),
      };
    }

    console.log('Fetching subscription for user:', userId);

    // Get user's subscription from Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }

    if (!data) {
      console.log('No subscription found for user:', userId);
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'none' }),
      };
    }

    // Check if subscription is active
    const isActive = data.status === 'active' || data.status === 'trialing';
    const status = isActive ? data.plan_type : 'none';

    console.log('Subscription status for user:', userId, 'is:', status);

    return {
      statusCode: 200,
      body: JSON.stringify({ status }),
    };
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
}; 