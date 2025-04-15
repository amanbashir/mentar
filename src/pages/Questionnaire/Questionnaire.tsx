import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const completeQuestionnaire = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      // Expecting questionnaire answers and project in location.state
      const userAnswers = location.state?.userAnswers;
      const project = location.state?.project;
      if (userAnswers && project) {
        // Map questionnaire answers to project fields
        const updates: Record<string, any> = {};
        if (userAnswers.capital) updates['budget'] = userAnswers.capital;
        if (userAnswers.targetProfit) updates['goal'] = userAnswers.targetProfit;
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('projects')
            .update(updates)
            .eq('id', project.id);
        }
      }
      navigate('/chat');
    };
    completeQuestionnaire();
  }, [navigate, location.state]);

  return null;
};

export default Questionnaire; 