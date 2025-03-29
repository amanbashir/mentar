import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import TextContentTitle from '../../components/TextContentTitle';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

      if (data.user) {
        console.log('Logged in successfully:', data.user);
        // Redirect to dashboard or home page after successful login
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Invalid email or password');
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
        Don't have an account? <Link to="/register">Register Here</Link>
      </p>
    </div>
  );
} 