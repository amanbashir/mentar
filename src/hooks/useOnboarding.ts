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

const INITIAL_MESSAGE: OnboardingMessage = {
  text: "Hi! I'm Mentar, your AI business coach. I'm here to help you start and grow your online business. What would you like to know about?",
  isUser: false
};

const SYSTEM_PROMPT = `You are Mentar, an AI business coach focused on helping people start and grow online businesses. Your approach is:

1. Direct and practical - Give actionable advice
2. Step-by-step - Break down complex topics
3. Encouraging - Support and motivate
4. Professional - Maintain a business-appropriate tone
5. Concise - Keep responses clear and focused

When responding:
- Ask one question at a time
- Provide specific examples when relevant
- Focus on practical implementation
- Keep responses under 3-4 sentences when possible
- Use bullet points for multiple steps
- End with a clear next step or question

Your goal is to guide users through starting their online business journey, from ideation to launch.`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useOnboarding() {
  const [messages, setMessages] = useState<OnboardingMessage[]>([INITIAL_MESSAGE]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  };

  const handleResponse = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Add user message immediately
      addMessage(userMessage, true);

      // Convert messages to OpenAI format
      const chatHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Add the latest user message
      chatHistory.push({
        role: 'user' as const,
        content: userMessage
      });

      // Initialize OpenAI client
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key is missing. Please check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }

      const openai = new OpenAI({
        apiKey: apiKey
      });

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...chatHistory
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";

      // Add a small delay before showing the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add AI response
      addMessage(aiResponse, false);

      // Check if we should start a module
      if (aiResponse.includes("Starting module")) {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      addMessage("I apologize, but I'm having trouble connecting right now. Please try again in a moment.", false);
    } finally {
      setIsLoading(false);
    }
  };

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