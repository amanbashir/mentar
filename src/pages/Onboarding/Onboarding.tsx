import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthAndUserData();
  }, []);

  const checkAuthAndUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      const { data: userData, error: userDataError } = await supabase
        .from('userData')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (userDataError) {
        console.error('Error fetching user data:', userDataError);
        navigate('/login');
        return;
      }

      if (userData?.business_type) {
        // If user already selected a business type, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      navigate('/login');
    }
  };

  const handleBusinessTypeSelect = async (businessType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      const { error } = await supabase
        .from('userData')
        .update({ business_type: businessType })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating business type:', error);
        return;
      }

      // Navigate to chat with business type
      navigate('/chat', { state: { businessType } });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="onboarding">
      <div className="logo">
        <img src="/logo-white.png" alt="Mentar" />
      </div>
      <div className="header">
        <h1>Welcome to your Future.</h1>
        <p>Pick one of our specialist trained specialists.</p>
      </div>
      <div className="cards">
        <div className="card" onClick={() => handleBusinessTypeSelect('ecommerce')}>
          <h2>Ecommerce</h2>
          <img 
            src="/specialists/businessman (1).png" 
            alt="Ecommerce Specialist" 
            className="card-image"
          />
        </div>
        <div className="card" onClick={() => handleBusinessTypeSelect('agency')}>
          <h2>Agency</h2>
          <img 
            src="/specialists/man-with-hat.png" 
            alt="Agency Specialist" 
            className="card-image"
          />
        </div>
        <div className="card" onClick={() => handleBusinessTypeSelect('software')}>
          <h2>Software</h2>
          <img 
            src="/specialists/short-hair-man-with-sweater.png" 
            alt="Software Specialist" 
            className="card-image"
          />
        </div>
        <div className="card coming-soon">
          <h2>Coming soon</h2>
          <img 
            src="/specialists/boy-with-vr.png" 
            alt="Coming Soon Specialist" 
            className="card-image"
          />
        </div>
      </div>
      <div className="footer">
        <p>
          Unsure where to start? <Link to="/chat" className="mentar-link">Speak to Mentar</Link>.
        </p>
      </div>
    </div>
  );
};

export default Onboarding; 