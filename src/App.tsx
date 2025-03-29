import { FormEvent, useState } from 'react';
import './App.css';
import TextContentTitle from './components/TextContentTitle';
import { supabase } from './lib/supabaseClient';

function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') { // unique violation
          setMessage('This email is already registered.');
        } else {
          setMessage(`Error: ${error.message}`);
        }
        return;
      }

      setMessage('Thanks for joining our waitlist!');
      setEmail('');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Caught error:', error);
      setMessage('Error signing up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="app">
        <div className="container">
          <TextContentTitle
            align="center"
            title="You're in."
            subtitle="Your first step, taken."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <TextContentTitle
          align="center"
          title="MentarAI"
          subtitle="Powerful guidance made accessible."
        />
        <form className="email-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="you@example.com"
            className="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App; 