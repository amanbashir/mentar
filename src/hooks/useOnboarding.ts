import { useState, useCallback } from 'react';
import OpenAI from 'openai';

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

export interface OnboardingMessage {
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

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

const INITIAL_MESSAGE = "My name is Mentar. I am here, specialised and ready, to help you start your online business journey. I have a range of different business experts that can train, guide and help you launch your own business. Do you know what business you want to start?";

const SYSTEM_PROMPT = `You are Mentar, a sharp, experienced AI business coach.
You help users launch online businesses.
You specialize in 4 business paths: eCommerce, Digital Products, Freelancing, and Content Creation.

Your approach:
1. If the user says they already know what business they want to start:
   - Acknowledge their choice
   - Reply with "Starting module..."
   - Be ready to begin specialized guidance

2. If the user says they're unsure:
   - Ask thoughtful, direct questions to learn their goals, interests, and situation
   - Guide them toward one of the 4 recommended paths
   - Keep replies short, motivating, and clear

Always maintain a friendly, encouraging tone while being direct and practical.`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useOnboarding() {
  const [messages, setMessages] = useState<OnboardingMessage[]>([{
    text: INITIAL_MESSAGE,
    isUser: false
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleResponse = useCallback(async (text: string) => {
    // Add user message to chat history
    setMessages(prev => [...prev, { text, isUser: true }]);
    setIsLoading(true);

    try {
      // Convert messages to OpenAI format
      const chatHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Add the latest user message
      chatHistory.push({
        role: 'user' as const,
        content: text
      });

      // Get GPT-4 response
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatHistory
        ],
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content || "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";

      // Add AI response after a small delay
      await delay(1000);
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);

      // Check if we should start a module
      if (aiResponse.includes("Starting module")) {
        setIsComplete(true);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const addMessage = useCallback((text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  }, []);

  return {
    messages,
    handleResponse,
    addMessage,
    isComplete,
    isLoading
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