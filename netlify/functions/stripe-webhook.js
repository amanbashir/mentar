import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify the webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Webhook Error: ${err.message}` }),
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        const session = stripeEvent.data.object;
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const priceId = subscription.items.data[0].price.id;

        // Determine plan type based on price ID
        let planType = "pro";
        if (priceId === "price_1RBPNaC2nY5YUxjH2eJVVHfZ") {
          planType = "pro_monthly";
        } else if (priceId === "price_1RBPO8C2nY5YUxjHEQLICLwR") {
          planType = "pro_annual";
        }

        // Update or insert subscription in Supabase
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer,
          status: subscription.status,
          plan_type: planType,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error updating subscription in database:", error);
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = stripeEvent.data.object;

        // Update subscription status in Supabase
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: updatedSubscription.status,
            current_period_end: new Date(
              updatedSubscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", updatedSubscription.id);

        if (updateError) {
          console.error("Error updating subscription status:", updateError);
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = stripeEvent.data.object;

        // Update subscription status in Supabase
        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", deletedSubscription.id);

        if (deleteError) {
          console.error("Error updating subscription status:", deleteError);
        }
        break;

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
