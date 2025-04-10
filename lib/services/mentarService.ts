import { UserProfile, ChatMessage, MentorConfig } from '@/types/mentar';
import { ecomModelConfig } from '../mentars/ecomModel';
import { supabase } from '../supabaseClient';

export class MentarService {
  private static readonly BUSINESS_TYPES = ['ecommerce', 'saas', 'copywriting', 'media buying'];
  
  static async startMentarChat(
    messages: ChatMessage[],
    userProfile: UserProfile
  ): Promise<ChatMessage> {
    const mentor = this.selectMentor(userProfile.businessType);
    const systemPrompt = this.buildSystemPrompt(mentor, userProfile);
    
    // Add system prompt to messages
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // TODO: Implement OpenAI call here
    // Return mock response for now
    return {
      role: 'assistant',
      content: 'Starting module...'
    };
  }

  static async handleOnboarding(userInput: string, userProfile: UserProfile) {
    const normalizedInput = userInput.toLowerCase();
    
    if (this.BUSINESS_TYPES.some(type => normalizedInput.includes(type))) {
      // User knows their business type
      const businessType = this.BUSINESS_TYPES.find(
        type => normalizedInput.includes(type)
      );
      
      await this.updateUserProfile(userProfile.id, { businessType });
      return {
        role: 'assistant',
        content: `Great choice! Let's start your ${businessType} journey...`
      };
    }

    // Continue with interrogation flow
    return this.getNextOnboardingQuestion(userProfile);
  }

  private static getNextOnboardingQuestion(userProfile: UserProfile): ChatMessage {
    const questions = [
      "What do you really want to build or change in your life?",
      "What's your 1–2 year vision if things go right?",
      "What's your starting point? (money, time, skills)",
      "What's holding you back?",
      "What do you hope I can help you with?"
    ];

    // Determine which question to ask based on profile completion
    // This is a simplified version - expand based on your needs
    const nextQuestion = questions.find((_, index) => {
      const fields = ['goal', 'vision', 'startingPoint', 'blockers', 'assistanceNeeded'];
      return !userProfile[fields[index]];
    });

    return {
      role: 'assistant',
      content: nextQuestion || "Thanks — I'm analyzing this to find your best path..."
    };
  }

  private static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase
      .from('userData')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating profile:', error);
    }
  }

  private static selectMentor(businessType?: string): MentorConfig {
    // Add more mentor selections as they're created
    return ecomModelConfig; // Default to ecommerce model for now
  }

  private static buildSystemPrompt(mentor: MentorConfig, userProfile: UserProfile): string {
    return `${mentor.systemPrompt}

Current User Context:
- Business Type: ${userProfile.businessType || 'exploring options'}
- Goal: ${userProfile.goal || 'not set'}
- Vision: ${userProfile.vision || 'not set'}
- Resources: ${JSON.stringify(userProfile.startingPoint || {})}`;
  }
} 