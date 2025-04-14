import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const Questionnaire = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      navigate('/chat');
    };

    checkAuthAndRedirect();
  }, [navigate]);

  return null; // This component will just redirect, so no need to render anything
};

export default Questionnaire; 