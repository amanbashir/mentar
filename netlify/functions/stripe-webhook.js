import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Use VITE_ prefixed environment variables
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event, context) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
    }

    // Log the incoming event for debugging
    console.log("Received webhook event:", {
      type: event.body ? JSON.parse(event.body).type : "no body",
      headers: event.headers,
    });

    const sig = event.headers["stripe-signature"];
    const endpointSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET;

    // Add validation for required environment variables
    if (
      !process.env.VITE_STRIPE_SECRET_KEY ||
      !process.env.VITE_STRIPE_WEBHOOK_SECRET
    ) {
      console.error(
        "Missing required environment variables for Stripe webhook"
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Server configuration error",
          debug: {
            hasStripeKey: !!process.env.VITE_STRIPE_SECRET_KEY,
            hasWebhookSecret: !!process.env.VITE_STRIPE_WEBHOOK_SECRET,
          },
        }),
      };
    }

    let stripeEvent;

    try {
      // Get the raw body string
      const rawBody = event.body;

      // Log raw event data for debugging
      console.log("Raw webhook data:", {
        rawBody: rawBody ? rawBody.substring(0, 100) + "..." : "no body",
        signature: sig ? "present" : "missing",
      });

      // Verify the webhook signature using the raw body
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        endpointSecret
      );
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      console.error("Debug info:", {
        signatureHeader: sig ? "present" : "missing",
        bodyLength: event.body ? event.body.length : 0,
        endpointSecretLength: endpointSecret ? endpointSecret.length : 0,
        rawBody: event.body ? event.body.substring(0, 100) + "..." : "no body",
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Webhook Error: ${err.message}`,
          debug: {
            hasSignature: !!sig,
            hasBody: !!event.body,
            hasEndpointSecret: !!endpointSecret,
          },
        }),
      };
    }

    // Handle the event
    try {
      console.log(`Processing webhook event: ${stripeEvent.type}`);

      switch (stripeEvent.type) {
        case "checkout.session.completed":
          const session = stripeEvent.data.object;

          // Log the session data
          console.log("Checkout session data:", {
            id: session.id,
            customerId: session.customer,
            subscriptionId: session.subscription,
            metadata: session.metadata,
          });

          // Ensure we have a user ID
          const userId = session.metadata?.userId;
          if (!userId) {
            throw new Error("No userId found in session metadata");
          }

          const subscriptionId = session.subscription;
          if (!subscriptionId) {
            throw new Error("No subscription ID found in session");
          }

          console.log(`Processing completed checkout for user: ${userId}`);

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          // Log subscription data
          console.log("Subscription data:", {
            id: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
          });

          const priceId = subscription.items.data[0].price.id;

          // Determine plan type based on price ID
          let planType = "pro";
          if (priceId === process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID) {
            planType = "pro_monthly";
          } else if (priceId === process.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID) {
            planType = "pro_annual";
          }

          console.log(
            `Updating subscription in database for user: ${userId}, plan: ${planType}`
          );

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
            throw error;
          }

          console.log(
            `Successfully processed checkout.session.completed for user: ${userId}`
          );
          break;

        case "customer.subscription.updated":
          const updatedSubscription = stripeEvent.data.object;

          console.log("Subscription update data:", {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            customerId: updatedSubscription.customer,
          });

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
            throw updateError;
          }

          console.log(
            `Successfully processed subscription update: ${updatedSubscription.id}`
          );
          break;

        case "customer.subscription.deleted":
          const deletedSubscription = stripeEvent.data.object;

          console.log("Subscription deletion data:", {
            id: deletedSubscription.id,
            status: deletedSubscription.status,
            customerId: deletedSubscription.customer,
          });

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
            throw deleteError;
          }

          console.log(
            `Successfully processed subscription deletion: ${deletedSubscription.id}`
          );
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
        body: JSON.stringify({
          message: error.message,
          eventType: stripeEvent?.type,
          error: error,
        }),
      };
    }
  } catch (error) {
    console.error("Unexpected error in webhook handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
