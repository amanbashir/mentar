import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  stripe_customer_id?: string;
  avatar_url?: string;
}

interface ProfileProps {
  userData: UserData | null;
}

const Profile: React.FC<ProfileProps> = ({ userData }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

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

  return (
    <div className="profile-section">
      <h1 className="profile-title">Profile Settings</h1>

      <div className="profile-info">
        <div className="profile-picture">
          <div className="avatar">
            {userData?.avatar_url ? (
              <img src={userData.avatar_url} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
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
  );
};

export default Profile;
