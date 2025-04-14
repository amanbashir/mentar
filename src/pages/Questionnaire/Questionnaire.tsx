import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Questionnaire.css';

// Define the questions to be asked
const questions = [
  "What is your dream income?",
  "How many hours per week can you commit to this business?",
  "What relevant skills or experience do you have?",
  "What are your main interests or hobbies?",
  "How do you prefer to learn (videos, reading, hands-on)?",
  "When would you like to launch your business?"
];

// Define the data structure to store answers
interface QuestionnaireData {
  goalIncome: string | null;
  resources: { capital: string | null; time_commitment: string | null } | null;
  starting_point: { capital: number | null; timeAvailable: string | null; skills: string[] } | null;
  interests: string | null;
  hobbies: string | null;
  learning_style: string | null;
  vision: string | null;
}

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<QuestionnaireData>({
    goalIncome: null,
    resources: { capital: null, time_commitment: null },
    starting_point: { capital: null, timeAvailable: null, skills: [] },
    interests: null,
    hobbies: null,
    learning_style: null,
    vision: null
  });
  const [businessType, setBusinessType] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a business type from state or need to fetch it
    const businessTypeFromState = location.state?.businessType;
    
    if (businessTypeFromState) {
      setBusinessType(businessTypeFromState);
    } else {
      checkUserBusinessType();
    }
  }, [location.state]);

  const checkUserBusinessType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // First, let's check what fields are available in the userData table
      const { data: userDataFromDB, error } = await supabase
        .from('userData')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      console.log('User data from DB:', userDataFromDB);

      if (userDataFromDB?.business_type) {
        setBusinessType(userDataFromDB.business_type);
      } else {
        // If no business type is set, redirect to onboarding
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Process and store the answer based on the current question
      let updatedUserData = { ...userData };
      
      switch (currentQuestionIndex) {
        case 0: // Dream income
          updatedUserData.goalIncome = answer.trim();
          break;
        case 1: // Hours per week
          updatedUserData.resources = {
            capital: updatedUserData.resources?.capital || null,
            time_commitment: `${answer.trim()} hours per week`
          };
          updatedUserData.starting_point = {
            capital: updatedUserData.starting_point?.capital || null,
            timeAvailable: `${answer.trim()} hours per week`,
            skills: updatedUserData.starting_point?.skills || []
          };
          break;
        case 2: // Skills
          updatedUserData.starting_point = {
            capital: updatedUserData.starting_point?.capital || null,
            timeAvailable: updatedUserData.starting_point?.timeAvailable || null,
            skills: answer.split(/,|\sand\s/).map(skill => skill.trim())
          };
          break;
        case 3: // Interests and hobbies
          updatedUserData.interests = answer.trim();
          updatedUserData.hobbies = answer.trim();
          break;
        case 4: // Learning style
          updatedUserData.learning_style = answer.trim();
          break;
        case 5: // Launch date
          updatedUserData.vision = `Launch business by ${answer.trim()}`;
          break;
      }

      setUserData(updatedUserData);

      // If this is the last question, save all data to Supabase and navigate to chat
      if (currentQuestionIndex === questions.length - 1) {
        await saveUserData(updatedUserData);
      } else {
        // Move to the next question
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setAnswer('');
      }
    } catch (error) {
      console.error('Error processing answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async (data: QuestionnaireData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Prepare the data to be saved
      const userDataToSave = {
        goalIncome: data.goalIncome,
        resources: data.resources,
        starting_point: data.starting_point,
        interests: data.interests,
        hobbies: data.hobbies,
        learning_style: data.learning_style,
        vision: data.vision
      };

      console.log('Saving user data:', userDataToSave);

      // First try with user_id
      let { error } = await supabase
        .from('userData')
        .update(userDataToSave)
        .eq('user_id', session.user.id);

      // If that fails, try with id
      if (error) {
        console.error('Error saving user data with user_id:', error);
        
        // Try with id instead
        const { error: idError } = await supabase
          .from('userData')
          .update(userDataToSave)
          .eq('id', session.user.id);
          
        if (idError) {
          console.error('Error saving user data with id:', idError);
          return;
        }
      }

      // Navigate to chat interface
      navigate('/chat', { 
        state: { businessType }
      });
    } catch (error) {
      console.error('Error in saveUserData:', error);
    }
  };

  return (
    <div className="questionnaire-page">
      <div className="logo">
        <img src="/logo-black.png" alt="Mentar Logo" />
      </div>
      
      <div className="questionnaire-container">
        <h1>Let's Begin.</h1>
        <p className="subtitle">Since we're going to partner with you, we need to understand you.</p>
        
        <div className="question-section">
          <h2>{questions[currentQuestionIndex]}</h2>
          
          <form onSubmit={handleSubmit}>
            <textarea
              className="answer-input"
              placeholder="Enter answer here (go into as much detail as you can)..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              required
            />
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !answer.trim()}
            >
              {isLoading ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire; 