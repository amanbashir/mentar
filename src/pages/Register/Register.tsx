import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import TextContentTitle from '../../components/TextContentTitle';
import './Register.css';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      // Handle successful registration
      console.log('Registered:', data);
      // Redirect or update UI state
    } catch (error) {
      setError('Error creating account');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <TextContentTitle
        align="center"
        title="MentarAI"
        subtitle="Powerful guidance made accessible."
      />
      <p className="welcome-text">Welcome to your future.</p>
      <form className="register-form" onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Free Account'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
} 