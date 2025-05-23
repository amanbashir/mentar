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
  if (!userProfile.selectedMentor) {
    return "Please select a business type to start chatting with your mentor.";
  }

  try {
    const response = await fetch('/.netlify/functions/mentor-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
export function isValidMentorType(mentor: string): boolean {
  return ['ecommerce', 'saas', 'copywriting', 'media buying'].includes(mentor);
} 