import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  createCheckoutSession,
  getSubscriptionStatus,
} from "../../services/stripeService";
import stripePromise from "../../lib/stripeClient";
import "./Settings.css";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  stripe_customer_id?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("billing");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("none");
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchSubscriptionStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from("userData")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage({ text: "Failed to load user data", type: "error" });
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (userData?.email) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          userData.email
        );
        if (error) throw error;
        setMessage({ text: "Password reset email sent", type: "success" });
      } catch (error) {
        console.error("Error sending password reset:", error);
        setMessage({
          text: "Failed to send password reset email",
          type: "error",
        });
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      if (!userData) throw new Error("No user data found");

      // Delete the user's data from userData table
      const { error: deleteDataError } = await supabase
        .from("userData")
        .delete()
        .eq("id", userData.id);

      if (deleteDataError) throw deleteDataError;

      // Delete the user's auth account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userData.id
      );

      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({ text: "Failed to delete account", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBackToChat = () => {
    navigate("/chat");
  };

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
    <div className="settings-container">
      <div className="settings-sidebar">
        <div className="sidebar-top">
          <div className="back-button" onClick={handleBackToChat}>
            ←
          </div>
          <div className="logo">
            <img src="/logo-black.png" alt="Logo" />
          </div>
        </div>
        <div className="menu-items">
          <div
            className={`menu-item ${
              activeSection === "billing" ? "active" : ""
            }`}
            onClick={() => setActiveSection("billing")}
          >
            Billing
          </div>
          <div
            className={`menu-item ${
              activeSection === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveSection("profile")}
          >
            Profile
          </div>
        </div>
      </div>

      <div className="settings-content">
        {/* {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )} */}

        {activeSection === "billing" && (
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
                    subscriptionStatus === "none"
                      ? "current-plan-btn"
                      : "upgrade-btn"
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
                    subscriptionStatus === "pro"
                      ? "current-plan-btn"
                      : "upgrade-btn"
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
                    subscriptionStatus !== "business" &&
                    handleUpgrade("price_yyyyy")
                  }
                  disabled={
                    subscriptionStatus === "business" || isLoadingCheckout
                  }
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
        )}

        {activeSection === "profile" && (
          <div className="profile-section">
            <h1>Profile Settings</h1>

            <div className="profile-info">
              <div className="profile-picture">
                <div className="avatar">
                  <div className="avatar-placeholder">👤</div>
                </div>
                <button className="upload-button" disabled={isLoading}>
                  Upload Photo
                </button>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <div className="profile-value">{userData?.email}</div>
              </div>

              <div className="profile-field">
                <label>Password</label>
                <div className="profile-value">
                  ••••••••
                  <button
                    className="edit-button"
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="action-button"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  Log Out
                </button>
                <button
                  className="action-button delete-account"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
