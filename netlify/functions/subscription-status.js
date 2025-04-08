import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Get the userId from query parameters
    const userId = event.queryStringParameters.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User ID is required' }),
      };
    }

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
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'none' }),
      };
    }

    // Check if subscription is active
    const isActive = data.status === 'active' || data.status === 'trialing';
    const status = isActive ? data.plan_type : 'none';

    return {
      statusCode: 200,
      body: JSON.stringify({ status }),
    };
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}; 