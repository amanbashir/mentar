import type { ChatMessage } from '../types/chat';

interface UserProfile {
  selectedMentor: string;
  // ... other profile fields
}

export async function startMentorChat(
  messages: ChatMessage[],
  userProfile: UserProfile
): Promise<string> {
  // Check if ecommerce mentor is selected
  if (userProfile.selectedMentor !== 'ecommerce') {
    return "Mentor chat not available until you choose eCommerce as your skill focus.";
  }

  try {
    // Make sure we're using the correct environment variable
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('/api/mentor-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.reply) {
      throw new Error('Invalid response format');
    }

    return data.reply;

  } catch (error) {
    console.error('Error in mentor chat:', error);
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
}

// Type guard for mentor types
export function isValidMentorType(mentor: string): mentor is 'ecommerce' {
  return mentor === 'ecommerce';
  // Easy to extend with more mentor types
} 