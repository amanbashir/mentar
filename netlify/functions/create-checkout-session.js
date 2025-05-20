import Stripe from 'stripe';

// Use environment variable for the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// Standard headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Handle CORS preflight requests
const handleCORS = (event) => {
  // For OPTIONS requests, return CORS headers immediately
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return {
      statusCode: 204, // No content
      headers: corsHeaders,
      body: '' // Empty body for OPTIONS
    };
  }
  
  // For other requests, return null to continue processing
  return null;
};

// Create test prices with unique lookup keys to avoid conflicts
const createTestPrices = async () => {
  try {
    console.log('Creating new test products and prices...');
    
    // Create unique lookup keys based on timestamp to avoid conflicts
    const timestamp = Date.now();
    const proLookupKey = `pro_monthly_${timestamp}`;
    const businessLookupKey = `business_monthly_${timestamp}`;
    
    // Create Pro product and price
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Monthly subscription for Pro features',
    });
    
    const proPrice = await stripe.prices.create({
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: proProduct.id,
      lookup_key: proLookupKey,
    });
    
    // Create Business product and price
    const businessProduct = await stripe.products.create({
      name: 'Business Plan',
      description: 'Monthly subscription for Business features',
    });
    
    const businessPrice = await stripe.prices.create({
      unit_amount: 2999, // $29.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: businessProduct.id,
      lookup_key: businessLookupKey,
    });
    
    // Log the created price IDs
    console.log('Created test prices:', {
      pro: proPrice.id,
      business: businessPrice.id
    });
    
    return {
      pro: proPrice.id,
      business: businessPrice.id
    };
  } catch (error) {
    console.error('Error creating test prices:', error);
    throw error;
  }
};

// Get active prices from Stripe
const getActivePrices = async () => {
  try {
    console.log('Fetching active prices from Stripe...');
    const pricesResponse = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product']
    });
    
    // Find a pro and business price based on the product name
    let proPrice = null;
    let businessPrice = null;
    
    for (const price of pricesResponse.data) {
      if (!price.product || typeof price.product === 'string') continue;
      
      const productName = price.product.name?.toLowerCase() || '';
      
      if (productName.includes('pro') && !proPrice) {
        proPrice = price;
      } else if (productName.includes('business') && !businessPrice) {
        businessPrice = price;
      }
      
      // If we found both, break early
      if (proPrice && businessPrice) break;
    }
    
    const result = {
      pro: proPrice?.id,
      business: businessPrice?.id
    };
    
    console.log('Found active prices:', result);
    return result;
  } catch (error) {
    console.error('Error fetching active prices:', error);
    return null;
  }
};

export const handler = async (event) => {
  console.log(`Function invoked with method: ${event.httpMethod}, path: ${event.path}`);
  
  // Handle CORS preflight request
  const corsResponse = handleCORS(event);
  if (corsResponse) {
    return corsResponse;
  }
  
  // Continue with normal processing for non-OPTIONS requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Method Not Allowed',
        allowed: 'POST' 
      }),
    };
  }

  try {
    const { priceId, userId, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!priceId || !userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'Missing required parameters',
          required: ['priceId', 'userId', 'successUrl', 'cancelUrl'],
          received: { priceId, userId, successUrl, cancelUrl }
        }),
      };
    }

    console.log('Creating Stripe checkout session with:', {
      priceId,
      userId,
      successUrl,
      cancelUrl,
    });

    // Initialize variables for actual price IDs
    let actualPriceId = priceId;
    let activePrices = null;
    
    // First, try to get existing active prices
    activePrices = await getActivePrices();
    
    // If we couldn't find active prices or if the requested price doesn't match our format
    if (!activePrices || !activePrices.pro || !activePrices.business) {
      // Create new test prices
      activePrices = await createTestPrices();
    }
    
    // Map the requested price ID to an actual price ID
    if (priceId.includes('pro') || priceId === 'price_1RTr8L76vITl07GqpgH91QTy') {
      actualPriceId = activePrices.pro;
    } else if (priceId.includes('business') || priceId === 'price_1RTr8g76vITl07GqL9frQYbF') {
      actualPriceId = activePrices.business;
    }
    
    if (actualPriceId !== priceId) {
      console.log(`Mapped price ID ${priceId} to actual price ID ${actualPriceId}`);
    }

    // Verify that the price exists before creating a checkout session
    try {
      await stripe.prices.retrieve(actualPriceId);
    } catch (priceError) {
      console.error(`Price ${actualPriceId} does not exist, creating new prices`);
      // If price doesn't exist, create new test prices as a fallback
      activePrices = await createTestPrices();
      
      // Use the newly created price
      if (priceId.includes('pro') || priceId === 'price_1RTr8L76vITl07GqpgH91QTy') {
        actualPriceId = activePrices.pro;
      } else if (priceId.includes('business') || priceId === 'price_1RTr8g76vITl07GqL9frQYbF') {
        actualPriceId = activePrices.business;
      }
      
      console.log(`Created new price ID: ${actualPriceId}`);
    }

    // Create Stripe checkout session with verified price
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      // Add automatic tax calculation (optional)
      automatic_tax: { enabled: true },
      // Add customer email collection
      customer_email: userId.includes('@') ? userId : undefined,
      // Add a custom UI theme
      ui_mode: 'hosted',
      // Add locale support
      locale: 'auto'
    });

    console.log('Checkout session created successfully:', session.id);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        id: session.id, 
        url: session.url,
        priceId: actualPriceId 
      }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: error.message,
        code: error.code || 'INTERNAL_SERVER_ERROR',
        type: error.type,
        param: error.param,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};