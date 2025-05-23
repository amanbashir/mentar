import { systemPrompt } from './systemPrompt';
import { softwareBlueprint } from './software-new-strat';
import { copywritingBlueprint } from './copywriting-new-strat';
import { smmaBlueprint } from './smma-new-strat';
import { ecommerceBlueprint } from './ecom-new-strat';
import { userProfile } from './userProfile';
import { conversationFlow } from './conversationFlow';

export type BusinessType = 'software' | 'agency' | 'ecommerce' | 'copywriting';

interface BaseStageInfo {
  objective: string;
  [key: string]: any; // Allow any additional properties for different stage types
}

interface RegularStageInfo extends BaseStageInfo {
  pitfalls?: string[];
  delivery?: string[];
  aiSupport?: string[];
}

interface OutreachStageInfo extends BaseStageInfo {
  criteria?: string[];
  examples?: string[];
  lowRiskAngles?: string[];
  samplePitch?: string;
}

interface DeliveryStageInfo extends BaseStageInfo {
  process?: string[];
  freeWorkPriorities?: string[];
  instructions?: string[];
}

interface SystemsStageInfo extends BaseStageInfo {
  tools?: string[];
  analysis?: string[];
  aiPrompt?: string;
}

interface ScalingStageInfo extends BaseStageInfo {
  levers?: string[];
  delegation?: string[];
  aiSupport?: string[];
}

interface PreQualificationInfo {
  description: string;
  questions: string[];
  actions?: string[];
  guidance?: string;
}

type StageInfo = BaseStageInfo;

interface Strategy {
  preStartFitCheck?: PreQualificationInfo;
  preStartEvaluation?: PreQualificationInfo;
  preQualification?: PreQualificationInfo;
  [key: string]: StageInfo | PreQualificationInfo | undefined;
}

const strategyMap: Record<BusinessType, Strategy> = {
  software: softwareBlueprint,
  agency: smmaBlueprint,
  ecommerce: ecommerceBlueprint,
  copywriting: copywritingBlueprint
};

export const stepPrompts: Record<string, string> = {
  budget: "Let's talk about your startup budget. What range are you working with — and how confident are you using it for this business?",
  time: "How many hours per week can you realistically dedicate to this business?",
  experience: "What's your background with online businesses, marketing, or tech?",
  skill: "What are you good at already? Design, writing, problem-solving, tech? Or none (yet)?",
  goalIncome: "What is your monthly profit goal 6–12 months from now?",
  salesComfort: "Are you comfortable reaching out to people or selling over the phone?",
  contentComfort: "Would you be comfortable creating short videos (UGC, demos, etc.)?",
  businessReason: "Why did you choose this business model?"
};

export function buildPrompt(businessType: BusinessType, stage: string, userInput: string): string {
  const strategy = strategyMap[businessType];
  const stageInfo = strategy[stage];

  if (!stageInfo) {
    return `I don't have specific guidance for ${stage} in the ${businessType} strategy. Please let me know what you'd like to focus on.`;
  }

  const { objective } = stageInfo;
  const aiSupport = stageInfo.aiSupport || [];
  const checklist = stageInfo.checklist || [];
  const validationChecklist = stageInfo.validationChecklist || [];
  const outreachChecklist = stageInfo.outreachChecklist || [];
  const clientDeliverySteps = stageInfo.clientDeliverySteps || [];
  const dailySystems = stageInfo.dailySystems || [];

  const aiSupportText = aiSupport.map((a: string) => `🧠 ${a}`).join("\n") || "";
  
  const formattedChecklist = checklist.length
    ? checklist.map((c: string) => `• ${c}`).join("\n")
    : "• No checklist available for this step.";

  const stepPrompt = stepPrompts[stage] || `Let's explore the step: ${stage}. Help the user complete it like a strategic workshop — clarify, guide, and confirm.`;

  if (stage === 'todo_list') {
    return `
      Current Stage: Todo List Management
      
      Please review the following aspects of the business plan:
      1. Business Idea Confirmation
         - Current idea: ${userInput.ideaConfirmation || 'Not confirmed'}
         - Validation status: ${userInput.validationStatus || 'Pending'}
         - Market fit: ${userInput.marketFit || 'To be assessed'}
      
      2. Action Steps
         - Next immediate actions: ${userInput.actionSteps || 'To be determined'}
         - Dependencies: ${userInput.dependencies || 'None identified'}
         - Timeline: ${userInput.timeline || 'To be established'}
      
      3. Progress Tracking
         - Completed steps: ${userInput.completedSteps || 'None'}
         - Current focus: ${userInput.currentFocus || 'Initial setup'}
         - Blockers: ${userInput.blockers || 'None identified'}
      
      4. Next Actions
         - Immediate next steps: ${userInput.nextActions || 'To be determined'}
         - Resources needed: ${userInput.resourcesNeeded || 'To be identified'}
         - Support required: ${userInput.supportRequired || 'None identified'}
      
      Please provide:
      1. Confirmation of the business idea and any adjustments needed
      2. Clear, actionable next steps with estimated timelines
      3. Identification of any blockers or challenges
      4. Specific resources or support needed
    `;
  }

  return `
${systemPrompt}

IMPORTANT CONTEXT:
🎯 Selected Business Type: ${businessType.toUpperCase()}
This user has already chosen their business type. If they provide a number in their first message, it represents their budget for this ${businessType} business.

🧠 Current Business Model: ${businessType.toUpperCase()}
📍 Stage: ${stage}, Step: ${stage}
🎯 Stage Objective: ${objective || "N/A"}
🔧 AI Support Recommendations: ${aiSupportText}

📌 Stage Checklist:
${formattedChecklist}

Prompt the user to solve the current step. Use a high-context, workshop-style question. Help them think and decide — do not move on until confirmed.

Prompt: ${stepPrompt}
`;
}

// Add UserData type
export interface UserData {
  first_name: string | null;
  email: string | null;
  avatar_url: string | null;
  business_type: string | null;
  goals: string | null;
  resources: { capital: string | null; time_commitment: string | null } | null;
  interests: string | null;
  hobbies: string | null;
  learning_style: string | null;
  vision: string | null;
  starting_point: { capital: number | null; timeAvailable: string | null; skills: string[] } | null;
  blockers: string[] | null;
  assistance_needed: string | null;
}

// Add project management functions
export const updateProjectOutputs = async (outputs: any) => {
  // Implementation will be added later
  console.log('Updating project outputs:', outputs);
};

export const updateProjectNotes = async (notes: string) => {
  // Implementation will be added later
  console.log('Updating project notes:', notes);
};

export const markStageCompleted = async (stage: string) => {
  // Implementation will be added later
  console.log('Marking stage as completed:', stage);
};

export const updateCurrentStep = async (step: string) => {
  // Implementation will be added later
  console.log('Updating current step:', step);
};