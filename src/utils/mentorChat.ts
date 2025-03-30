import type { ChatCompletionMessageParam } from 'openai/resources/chat';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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
    const response = await fetch('/api/mentor-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to get mentor response');
    }

    const data = await response.json();
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