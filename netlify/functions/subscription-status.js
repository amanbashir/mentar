import { createClient } from '@supabase/supabase-js';

// Log environment variables (without sensitive values)
console.log('Environment check:');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event, context) => {
  console.log('Function invoked with method:', event.httpMethod);
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
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