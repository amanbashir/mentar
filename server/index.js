const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

  try {
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

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get subscription status
app.get('/api/subscription-status', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Get user's subscription from Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ message: error.message });
    }

    if (!data) {
      return res.json({ status: 'none' });
    }

    // Check if subscription is active
    const isActive = data.status === 'active' || data.status === 'trialing';
    const status = isActive ? data.plan_type : 'none';

    res.json({ status });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Webhook to handle Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;
      
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      
      // Determine plan type based on price ID
      let planType = 'pro';
      if (priceId === 'price_monthly_id') {
        planType = 'pro_monthly';
      } else if (priceId === 'price_annual_id') {
        planType = 'pro_annual';
      }
      
      // Update or insert subscription in Supabase
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer,
          status: subscription.status,
          plan_type: planType,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('Error updating subscription in database:', error);
      }
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      const updatedUserId = updatedSubscription.metadata.userId;
      
      // Update subscription status in Supabase
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: updatedSubscription.status,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', updatedSubscription.id);
        
      if (updateError) {
        console.error('Error updating subscription status:', updateError);
      }
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      
      // Update subscription status in Supabase
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', deletedSubscription.id);
        
      if (deleteError) {
        console.error('Error updating subscription status:', deleteError);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 