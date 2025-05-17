import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/onboarding");
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, "Session:", session);

      if (event === "SIGNED_IN") {
        // User has verified their email and is signed in
        navigate("/onboarding");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createUserData = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("userData")
        .insert({
          user_id: userId,
          email: formData.email,
          full_name: formData.fullName,
          created_at: new Date().toISOString(),
        })
        .single();

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error creating user data:", error);
      return { error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowVerificationMessage(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      if (!authData?.user) {
        throw new Error("No user data received from registration");
      }

      // 2. Create initial userData record
      // const { error: userDataError } = await createUserData(authData.user.id);

      // if (userDataError) {
      //   throw userDataError;
      // }

      // 3. Show verification message and store email
      setRegisteredEmail(formData.email);
      setShowVerificationMessage(true);
      console.log("Registration successful, awaiting verification");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message.includes("duplicate key")) {
        setError("An account with this email already exists");
      } else {
        setError(error.message || "Error creating account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="logo-container">
        <div className="logo">
          <img src="/logo-black.png" alt="Mentar" />
        </div>
      </div>
      <div className="main-content">
        <div className="logo-section">
          <img src="/logo-white.png" alt="Mentar" className="logo-main" />
          <h1 className="logo-title">Mentar</h1>
        </div>
        {showVerificationMessage ? (
          <div className="verification-message">
            <h2>Check your email</h2>
            <p>We've sent a verification link to {registeredEmail}.</p>
            <p>
              Click the link in the email to verify your account and continue to
              onboarding.
            </p>
            <p className="resend-note">
              The verification email may take a few minutes to arrive. Check
              your spam folder if you don't see it.
            </p>
          </div>
        ) : (
          <form className="register-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="register-input"
              required
              disabled={loading}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="register-input"
              required
              disabled={loading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="register-input"
              required
              minLength={6}
              disabled={loading}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="register-input"
              required
              minLength={6}
              disabled={loading}
            />
            {error && <p className="error-message">{error}</p>}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
        <Link to="/login" className="login-text">
          Already have an account? Log in
        </Link>
      </div>
      <p className="tagline">Powerful guidance made accessible.</p>
    </div>
  );
};

export default Register;
