import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface UserProfile {
  fullName: string;
  goals: string;
  resources: {
    capital: string;
    timeCommitment: string;
  };
  interests: string;
  hobbies: string;
  learningStyle: string;
}

interface OnboardingMessage {
  text: string;
  isUser: boolean;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ONBOARDING_QUESTIONS = [
  "Let's start with your full name?",
  "Great! Now, tell me about your dreams or long-term goals. What do you want to achieve?",
  "What resources do you have available? Please share your available capital and time commitment.",
  "What industries or areas of business excite you the most?",
  "What hobbies or activities energize you and make you feel alive?",
  "Last question: How do you prefer to learn? (e.g., videos, reading, practical challenges, etc.)"
];

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [messages, setMessages] = useState<OnboardingMessage[]>([{
    text: ONBOARDING_QUESTIONS[0],
    isUser: false
  }]);
  const [isComplete, setIsComplete] = useState(false);

  const handleResponse = useCallback(async (response: string) => {
    // Add user's response to messages
    setMessages(prev => [...prev, { text: response, isUser: true }]);

    // Update profile based on current step
    switch (currentStep) {
      case 0:
        setProfile(prev => ({ ...prev, fullName: response }));
        break;
      case 1:
        setProfile(prev => ({ ...prev, goals: response }));
        break;
      case 2:
        setProfile(prev => ({ ...prev, resources: { capital: response, timeCommitment: response } }));
        break;
      case 3:
        setProfile(prev => ({ ...prev, interests: response }));
        break;
      case 4:
        setProfile(prev => ({ ...prev, hobbies: response }));
        break;
      case 5:
        setProfile(prev => ({ ...prev, learningStyle: response }));
        break;
    }

    // If not the last question, proceed to next
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setMessages(prev => [...prev, {
        text: ONBOARDING_QUESTIONS[currentStep + 1],
        isUser: false
      }]);
    } else {
      // Complete onboarding
      try {
        const { error } = await supabase
          .from('user_profiles')
          .insert([profile]);

        if (error) throw error;

        setMessages(prev => [...prev, {
          text: "Awesome! I'm now matching you with the perfect mentor based on what you shared. I'll use this information to provide personalized guidance and recommendations for your journey.",
          isUser: false
        }]);
        setIsComplete(true);
      } catch (error) {
        console.error('Error saving profile:', error);
        setMessages(prev => [...prev, {
          text: "I apologize, but I encountered an issue saving your profile. Don't worry though, I'll still be able to help you!",
          isUser: false
        }]);
      }
    }
  }, [currentStep, profile]);

  return {
    messages,
    handleResponse,
    isComplete,
    currentStep
  };
} 