import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface UserProfile {
  firstName: string;
  goals: string;
  resources: {
    capital: string;
    timeCommitment: string;
  };
  interests: string;
  hobbies: string;
  learningStyle: string;
  businessType?: string;
  vision?: string;
  startingPoint?: {
    capital?: number;
    timeAvailable?: string;
    skills?: string[];
  };
  blockers?: string[];
  assistanceNeeded?: string;
}

export interface OnboardingMessage {
  text: string;
  isUser: boolean;
}

interface UserProfileDB {
  first_name: string;
  goals: string;
  resources: {
    capital: string;
    time_commitment: string;
  };
  interests: string;
  hobbies: string;
  learning_style: string;
  business_type?: string;
  vision?: string;
  starting_point?: {
    capital?: number;
    timeAvailable?: string;
    skills?: string[];
  };
  blockers?: string[];
  assistance_needed?: string;
}

const INITIAL_MESSAGE: OnboardingMessage = {
  text: "My name is Mentar. I am here, specialised and ready, to help you start your online business journey. I have a range of different business experts that can train, guide and help you launch your own business. Do you know what business you want to start?",
  isUser: false
};

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useOnboarding() {
  const [messages, setMessages] = useState<OnboardingMessage[]>([INITIAL_MESSAGE]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: '',
    goals: '',
    resources: {
      capital: '',
      timeCommitment: ''
    },
    interests: '',
    hobbies: '',
    learningStyle: ''
  });

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      // Convert from frontend format to database format
      const dbUpdates: Partial<UserProfileDB> = {
        first_name: updates.firstName,
        goals: updates.goals,
        resources: updates.resources && {
          capital: updates.resources.capital,
          time_commitment: updates.resources.timeCommitment
        },
        interests: updates.interests,
        hobbies: updates.hobbies,
        learning_style: updates.learningStyle,
        business_type: updates.businessType,
        vision: updates.vision,
        starting_point: updates.startingPoint,
        blockers: updates.blockers,
        assistance_needed: updates.assistanceNeeded
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof UserProfileDB] === undefined) {
          delete dbUpdates[key as keyof UserProfileDB];
        }
      });

      const { error } = await supabase
        .from('userData')
        .update(dbUpdates)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const handleResponse = async (userMessage: string) => {
    try {
      setIsLoading(true);
      addMessage(userMessage, true);

      // Call the Supabase Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [...messages, { text: userMessage, isUser: true }] }
      });

      if (error) throw error;

      const aiResponse = data.message;
      addMessage(aiResponse, false);

      // Update profile based on the conversation
      const profileUpdates: Partial<UserProfile> = {};

      // Extract business type if mentioned
      if (userMessage.toLowerCase().includes('ecommerce') || 
          userMessage.toLowerCase().includes('saas') || 
          userMessage.toLowerCase().includes('copywriting') ||
          userMessage.toLowerCase().includes('smma') ||
          userMessage.toLowerCase().includes('sales')) {
        profileUpdates.businessType = userMessage.toLowerCase();
        setIsComplete(true);
      }

      // Extract capital information
      if (userMessage.includes('$')) {
        profileUpdates.startingPoint = {
          ...userProfile.startingPoint,
          capital: parseInt(userMessage.match(/\$(\d+)/)?.[1] || '0')
        };
      }

      // Extract time commitment
      if (userMessage.toLowerCase().includes('hour')) {
        profileUpdates.resources = {
          ...userProfile.resources,
          timeCommitment: userMessage
        };
      }

      // Update the profile if we have any changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(profileUpdates);
      }

    } catch (error) {
      console.error('Error in handleResponse:', error);
      addMessage('I apologize, but I encountered a connection issue. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isComplete,
    isLoading,
    userProfile,
    handleResponse,
    updateUserProfile
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