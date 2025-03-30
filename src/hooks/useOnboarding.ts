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

  const handleResponse = useCallback(async (response: string) => {
    // Add user's response
    setMessages(prev => [...prev, { text: response, isUser: true }]);

    if (!isComplete) {
      // Handle onboarding flow
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

      await delay(1000);

      if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setMessages(prev => [...prev, {
          text: ONBOARDING_QUESTIONS[currentStep + 1],
          isUser: false
        }]);
      } else {
        try {
          const dbProfile: UserProfileDB = {
            full_name: profile.fullName!,
            goals: profile.goals!,
            resources: {
              capital: profile.resources?.capital!,
              time_commitment: profile.resources?.timeCommitment!
            },
            interests: profile.interests!,
            hobbies: profile.hobbies!,
            learning_style: profile.learningStyle!
          };

          const { error } = await supabase
            .from('user_profiles')
            .insert([dbProfile]);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          await delay(1000);

          // Determine mentor based on profile
          const mentorType = determineMentorType(dbProfile);
          
          setMessages(prev => [...prev, {
            text: `Perfect! Based on your profile, I'm connecting you with ${getMentorIntro(mentorType)}. They'll be your dedicated mentor on this journey.`,
            isUser: false
          }]);

          await delay(2000);

          setMessages(prev => [...prev, {
            text: getMentorWelcome(mentorType, dbProfile.full_name),
            isUser: false
          }]);

          setIsComplete(true);
        } catch (error) {
          console.error('Error saving profile:', error);
          await delay(1000);
          setMessages(prev => [...prev, {
            text: "I apologize, but I encountered an issue saving your profile. Don't worry though, I'll still be able to help you!",
            isUser: false
          }]);
        }
      }
    }
  }, [currentStep, profile, isComplete]);

  return {
    messages,
    handleResponse,
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