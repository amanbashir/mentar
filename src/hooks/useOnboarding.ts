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

interface UserProfileDB {
  full_name: string;
  goals: string;
  resources: {
    capital: string;
    time_commitment: string;
  };
  interests: string;
  hobbies: string;
  learning_style: string;
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [messages, setMessages] = useState<OnboardingMessage[]>([{
    text: ONBOARDING_QUESTIONS[0],
    isUser: false
  }]);
  const [isComplete, setIsComplete] = useState(false);

  const handleResponse = useCallback(async (text: string) => {
    // Add message to chat history
    setMessages(prev => [...prev, { text, isUser: true }]);
  }, []);

  return {
    messages,
    handleResponse: useCallback((text: string, isUser = true) => {
      setMessages(prev => [...prev, { text, isUser }]);
    }, []),
    isComplete,
    currentStep,
    profile
  };
}

// Helper functions
function determineMentorType(profile: UserProfileDB): string {
  // For now, always return ecommerce, but we can add logic here later
  return 'ecommerce';
}

function getMentorIntro(mentorType: string): string {
  const mentors = {
    ecommerce: "Eli the eCom Builder, an expert in EU dropshipping and general stores"
    // Add more mentors here as we expand
  };
  return mentors[mentorType as keyof typeof mentors];
}

function getMentorWelcome(mentorType: string, userName: string): string {
  const welcomes = {
    ecommerce: `Hi ${userName}, I'm Eli! I've reviewed your profile and I'm excited to help you build your dropshipping business. I specialize in EU market strategies and have helped many entrepreneurs like you succeed in this space. Let's start by discussing your first steps into ecommerce. What specific questions do you have about starting a general store?`
    // Add more welcome messages as we expand
  };
  return welcomes[mentorType as keyof typeof welcomes];
} 