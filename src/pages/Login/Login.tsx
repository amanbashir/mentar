import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        throw error;
      }

      if (data.user) {
        console.log("Logged in successfully:", data.user);
        navigate("/chat");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="main-content">
        <div className="logo-section">
          <img src="/logo-white.png" alt="Mentar Logo" className="logo" />
          <h1 className="logo-title">Mentar</h1>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="login-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="login-input"
          />

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            Sign In
          </button>

          <Link to="/register" className="register-text">
            Don't have an account? Register Here
          </Link>
        </form>
      </div>

      <p className="tagline">Powerful guidance made accessible.</p>
    </div>
  );
}
