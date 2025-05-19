import React, { useState } from "react";
import {
  createCheckoutSession,
  getSubscriptionStatus,
} from "../../services/stripeService";

interface BillingProps {
  subscriptionStatus: string;
  onSubscriptionStatusChange: (status: string) => void;
}

const Billing: React.FC<BillingProps> = ({
  subscriptionStatus,
  onSubscriptionStatusChange,
}) => {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleUpgrade = async (priceId: string) => {
    setIsLoadingCheckout(true);
    try {
      const successUrl = `${window.location.origin}/settings?success=true`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;
      const session = await createCheckoutSession(
        priceId,
        successUrl,
        cancelUrl
      );
      if (session?.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setMessage({ text: "Failed to start checkout process", type: "error" });
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="billing-section">
      <h1>Billing</h1>
      <div className="current-plan">
        Current Plan: <span>{subscriptionStatus || "Free"}</span>
      </div>

      <div className="pricing-cards">
        <div className="pricing-card">
          <h2>Free</h2>
          <div className="price">$0</div>
          <div className="price-period">forever</div>
          <ul className="features">
            <li>Basic access</li>
            <li>Limited messages</li>
            <li>Standard support</li>
          </ul>
          <button
            className={
              subscriptionStatus === "none" ? "current-plan-btn" : "upgrade-btn"
            }
            disabled={subscriptionStatus === "none" || isLoadingCheckout}
          >
            {subscriptionStatus === "none" ? "Current Plan" : "Downgrade"}
          </button>
        </div>

        <div className="pricing-card featured">
          <div className="discount-badge">Most Popular</div>
          <h2>Pro</h2>
          <div className="price">$9.99</div>
          <div className="price-period">per month</div>
          <ul className="features">
            <li>Unlimited messages</li>
            <li>Faster response times</li>
            <li>Priority support</li>
          </ul>
          <button
            className={
              subscriptionStatus === "pro" ? "current-plan-btn" : "upgrade-btn"
            }
            onClick={() =>
              subscriptionStatus !== "pro" && handleUpgrade("price_xxxxx")
            }
            disabled={subscriptionStatus === "pro" || isLoadingCheckout}
          >
            {isLoadingCheckout
              ? "Loading..."
              : subscriptionStatus === "pro"
              ? "Current Plan"
              : "Upgrade"}
          </button>
        </div>

        <div className="pricing-card">
          <h2>Business</h2>
          <div className="price">$29.99</div>
          <div className="price-period">per month</div>
          <ul className="features">
            <li>Everything in Pro</li>
            <li>Team collaboration</li>
            <li>Advanced features</li>
          </ul>
          <button
            className={
              subscriptionStatus === "business"
                ? "current-plan-btn"
                : "upgrade-btn"
            }
            onClick={() =>
              subscriptionStatus !== "business" && handleUpgrade("price_yyyyy")
            }
            disabled={subscriptionStatus === "business" || isLoadingCheckout}
          >
            {isLoadingCheckout
              ? "Loading..."
              : subscriptionStatus === "business"
              ? "Current Plan"
              : "Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
