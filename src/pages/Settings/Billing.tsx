import React, { useState, useEffect } from "react";
import {
  createCheckoutSession,
  redirectToCheckout,
  getSubscriptionStatus,
} from "../../services/stripeService";

interface BillingProps {
  subscriptionStatus: string;
  onSubscriptionStatusChange: (status: string) => void;
}

interface PlanDetails {
  id: string;
  name: string;
  amount: string;
  period: string;
  features: string[];
}

// We'll use basic IDs that our serverless function can map to actual Stripe price IDs
const PLANS: Record<string, PlanDetails> = {
  free: {
    id: "free",
    name: "Free",
    amount: "$0",
    period: "forever",
    features: ["Basic access", "Limited messages", "Standard support"],
  },
  pro: {
    id: "pro_plan", // This will be mapped in the serverless function
    name: "Pro",
    amount: "$9.99",
    period: "per month",
    features: [
      "Unlimited messages",
      "Faster response times",
      "Priority support",
    ],
  },
  business: {
    id: "business_plan", // This will be mapped in the serverless function
    name: "Business",
    amount: "$29.99",
    period: "per month",
    features: ["Everything in Pro", "Team collaboration", "Advanced features"],
  },
};

interface MessageType {
  title: string;
  type: "success" | "error";
  details?: string;
  showAdBlockerHelp?: boolean;
}

const Billing: React.FC<BillingProps> = ({
  subscriptionStatus,
  onSubscriptionStatusChange,
}) => {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageType | null>(null);
  const [checkoutAttempts, setCheckoutAttempts] = useState<number>(0);

  // Check for URL params when the component mounts
  useEffect(() => {
    const url = new URL(window.location.href);
    const success = url.searchParams.get("success");
    const canceled = url.searchParams.get("canceled");
    const sessionId = url.searchParams.get("session_id");
    const priceId = url.searchParams.get("price_id");

    if (success === "true") {
      setMessage({
        title: "Subscription Activated",
        type: "success",
        details:
          "Your subscription has been processed successfully! Your account has been upgraded.",
      });

      // Determine the plan type based on the price ID if available
      if (sessionId) {
        console.log("Session ID:", sessionId);
        let planType = "pro"; // Default to pro

        if (priceId) {
          if (priceId.toLowerCase().includes("business")) {
            planType = "business";
          } else if (priceId.toLowerCase().includes("pro")) {
            planType = "pro";
          }
        }

        // Update the subscription status
        onSubscriptionStatusChange(planType);
      }
    } else if (canceled === "true") {
      setMessage({
        title: "Checkout Canceled",
        type: "error",
        details:
          "Your subscription process was canceled. No charges were made.",
      });
    }

    // Clean up URL params
    if (success || canceled) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("success");
      cleanUrl.searchParams.delete("canceled");
      cleanUrl.searchParams.delete("session_id");
      cleanUrl.searchParams.delete("price_id");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, [onSubscriptionStatusChange]);

  const detectAdBlocker = async (): Promise<boolean> => {
    try {
      // Try to fetch a test resource from stripe.com
      const testFetch = await fetch(
        "https://js.stripe.com/v3/fingerprinted/js/checkout-app-4a52d7ded951177134d3c790d7bad5a6.js",
        {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        }
      );
      return false; // No ad blocker detected
    } catch (error) {
      console.log("Possible ad blocker detected:", error);
      return true; // Ad blocker likely detected
    }
  };

  const handleUpgrade = async (priceId: string) => {
    if (priceId === "free") return;

    setIsLoadingCheckout(true);
    setMessage(null);
    setCheckoutAttempts((prev) => prev + 1);

    try {
      // Check for ad blocker first
      const hasAdBlocker = await detectAdBlocker();

      if (hasAdBlocker) {
        setMessage({
          title: "Ad Blocker Detected",
          type: "error",
          details:
            "We've detected that you may have an ad blocker or privacy extension active. These can interfere with the payment process. Please disable it for this site to continue.",
          showAdBlockerHelp: true,
        });
        setIsLoadingCheckout(false);
        return;
      }

      // Add cache-busting parameter to avoid cached redirects
      const timestamp = Date.now();
      const successUrl = `${window.location.origin}/settings?success=true&t=${timestamp}`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true&t=${timestamp}`;

      // Create a checkout session
      console.log(`Creating checkout session for price: ${priceId}`);
      const session = await createCheckoutSession(
        priceId,
        successUrl,
        cancelUrl
      );

      // Redirect to Stripe Checkout
      if (session?.id) {
        console.log(`Redirecting to checkout with session ID: ${session.id}`);
        await redirectToCheckout(session.id);
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error starting checkout:", error);

      // Check if this might be a Stripe API error
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("No such price") ||
        errorMessage.includes("resource_missing") ||
        errorMessage.includes("PRICE_NOT_FOUND")
      ) {
        // If this is our first attempt, try again (the server might need to create prices)
        if (checkoutAttempts < 2) {
          console.log("Retrying checkout after price creation...");
          setMessage({
            title: "Preparing Checkout",
            type: "success",
            details:
              "We're setting up your checkout session. Please wait a moment...",
          });
          setTimeout(() => handleUpgrade(priceId), 2000);
          return;
        }

        setMessage({
          title: "Stripe Configuration Issue",
          type: "error",
          details:
            "Our system is having trouble with the payment configuration. This is usually fixed quickly. Please try again in a few minutes or contact support if the issue persists.",
        });
      } else if (
        errorMessage.includes("blocked") ||
        errorMessage.includes("network") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("r.stripe.com") ||
        errorMessage.includes("js.stripe.com")
      ) {
        setMessage({
          title: "Payment Processing Blocked",
          type: "error",
          details:
            "Your browser appears to be blocking connections to our payment processor. This is usually caused by ad blockers, privacy extensions, or network restrictions.",
          showAdBlockerHelp: true,
        });
      } else {
        setMessage({
          title: "Checkout Error",
          type: "error",
          details: `We encountered an issue while setting up your checkout: ${errorMessage}. Please try again or contact our support team if the problem persists.`,
        });
      }
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const renderPlanCard = (plan: PlanDetails, isCurrent: boolean) => {
    const isFeatured = plan.name === "Pro";
    return (
      <div className={`pricing-card ${isFeatured ? "featured" : ""}`}>
        {isFeatured && <div className="discount-badge">Most Popular</div>}
        <h2>{plan.name}</h2>
        <div className="price">{plan.amount}</div>
        <div className="price-period">{plan.period}</div>
        <ul className="features">
          {plan.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <button
          className={isCurrent ? "current-plan-btn" : "upgrade-btn"}
          onClick={() => !isCurrent && handleUpgrade(plan.id)}
          disabled={isCurrent || isLoadingCheckout || plan.id === "free"}
        >
          {isLoadingCheckout
            ? "Loading..."
            : isCurrent
            ? "Current Plan"
            : plan.id === "free"
            ? "Free Plan"
            : "Upgrade"}
        </button>
      </div>
    );
  };

  return (
    <div className="billing-section">
      <h1>Billing</h1>
      <div className="current-plan">
        Current Plan:{" "}
        <span>
          {subscriptionStatus === "none"
            ? "Free"
            : subscriptionStatus.charAt(0).toUpperCase() +
              subscriptionStatus.slice(1)}
        </span>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          <div className="message-title">{message.title}</div>
          {message.details && (
            <div className="message-details">{message.details}</div>
          )}
          {message.showAdBlockerHelp && (
            <div className="ad-blocker-help">
              <p>
                Common ad blockers and privacy extensions that might be causing
                this issue:
              </p>
              <ul>
                <li>uBlock Origin</li>
                <li>AdBlock / AdBlock Plus</li>
                <li>Brave Shield</li>
                <li>Privacy Badger</li>
                <li>Ghostery</li>
                <li>DuckDuckGo Privacy Essentials</li>
              </ul>
              <p>
                Try temporarily disabling these extensions for this site, or use
                a different browser.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="pricing-cards">
        {renderPlanCard(PLANS.free, subscriptionStatus === "none")}
        {renderPlanCard(PLANS.pro, subscriptionStatus === "pro")}
        {renderPlanCard(PLANS.business, subscriptionStatus === "business")}
      </div>
    </div>
  );
};

export default Billing;
