import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Onboarding.css';

interface Project {
  id: string;
  user_id: string;
  business_type: string;
  created_at: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
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

      // Create a new project entry in the projects table
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: session.user.id,
            business_type: businessType,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (projectError) {
        console.error('Error creating new project:', projectError);
        return;
      }

      // Navigate to questionnaire with the new project info
      navigate('/questionnaire', { 
        state: { 
          businessType,
          project: {
            id: newProject.id,
            business_type: businessType,
            created_at: newProject.created_at
          }
        } 
      });
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
        <img src="/logo-black.png" alt="Mentar" />
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
        <div className="card" onClick={() => handleBusinessTypeSelect('copywriting')}>
          <h2>Copywriting</h2>
          <img 
            src="/specialists/boy-with-vr.png" 
            alt="Copywriting Specialist" 
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