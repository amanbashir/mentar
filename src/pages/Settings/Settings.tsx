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
      <div className="settings-header">
        <h1>Settings</h1>
        <button onClick={handleBackToChat} className="back-button">
          Back to Chat
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <button
            className={activeSection === "billing" ? "active" : ""}
            onClick={() => setActiveSection("billing")}
          >
            Billing
          </button>
          <button
            className={activeSection === "account" ? "active" : ""}
            onClick={() => setActiveSection("account")}
          >
            Account
          </button>
        </div>

        <div className="settings-main">
          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          {activeSection === "billing" && (
            <div className="billing-section">
              <h2>Subscription Status</h2>
              <p>Current Plan: {subscriptionStatus}</p>
              {subscriptionStatus === "none" && (
                <button
                  onClick={() => handleUpgrade("price_xxxxx")}
                  disabled={isLoadingCheckout}
                >
                  {isLoadingCheckout ? "Loading..." : "Upgrade to Pro"}
                </button>
              )}
            </div>
          )}

          {activeSection === "account" && (
            <div className="account-section">
              <h2>Account Settings</h2>

              <div className="setting-item">
                <h3>Email</h3>
                <p>{userData?.email}</p>
              </div>

              <div className="setting-item">
                <h3>Password</h3>
                <button onClick={handlePasswordReset} disabled={isLoading}>
                  Reset Password
                </button>
              </div>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <button
                  onClick={handleLogout}
                  className="logout-button"
                  disabled={isLoading}
                >
                  Log Out
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="delete-button"
                  disabled={isLoading}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
