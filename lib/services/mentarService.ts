import { UserProfile, ChatMessage, MentorConfig } from '@/types/mentar';
import { systemPrompt } from '../mentars/systemPrompt';
import { buildPrompt } from '../mentars/promptBuilder';
import { supabase } from '../supabaseClient';

export class MentarService {
  private static readonly BUSINESS_TYPES = ['ecommerce', 'agency', 'saas', 'copywriting'];
  
  static async startMentarChat(
    messages: ChatMessage[],
    userProfile: UserProfile
  ): Promise<ChatMessage> {
    const systemPromptText = buildPrompt('stage_0', 'budget');
    
    // Add system prompt to messages
    const fullMessages = [
      { role: 'system', content: systemPromptText },
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

  private static selectMentor(businessType?: string): string {
    // Return the appropriate business type or default to ecommerce
    return businessType || 'ecommerce';
  }

  private static buildSystemPrompt(businessType: string, userProfile: UserProfile): string {
    return buildPrompt('stage_0', 'budget');
  }
} 