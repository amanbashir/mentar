export interface UserProfile {
  id: string;
  businessType?: string;
  goal?: string;
  vision?: string;
  startingPoint?: {
    capital?: number;
    timeAvailable?: string;
    skills?: string[];
  };
  blockers?: string[];
  assistanceNeeded?: string;
}

export interface MentorConfig {
  id: string;
  name: string;
  specialty: string;
  tone: string;
  teachingStyle: string;
  systemPrompt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
} 