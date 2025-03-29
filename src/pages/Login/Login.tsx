import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import TextContentTitle from '../../components/TextContentTitle';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Handle successful login
      console.log('Logged in:', data);
      // Redirect or update UI state
    } catch (error) {
      setError('Invalid email or password');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <TextContentTitle
        align="center"
        title="MentarAI"
        subtitle="Powerful guidance made accessible."
      />
      <p className="welcome-text">Welcome to your future.</p>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <p className="register-link">
        Don't have an account? <a href="/register">Register Here</a>
      </p>
    </div>
  );
} 