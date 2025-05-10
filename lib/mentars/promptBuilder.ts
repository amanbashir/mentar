import { systemPrompt } from './systemPrompt';
import { saasStrategy } from './saasStrategy';
import { copywritingStrategy } from './copywritingStrategy';
import { userProfile } from './userProfile';
import { conversationFlow } from './conversationFlow';
import { ecomStrategy } from './ecomStrategy';
import { agencyStrategy } from './agencyStrategy';

export type BusinessType = 'ecommerce' | 'agency' | 'software' | 'copywriting';

interface BaseStageInfo {
  objective: string;
  aiSupport: string[];
}

interface RegularStageInfo extends BaseStageInfo {
  checklist: string[];
  validationChecklist?: string[];
  pageChecklist?: string[];
  testingChecklist?: string[];
  dailyRoutine?: string[];
  outreachChecklist?: string[];
  outreachTypes?: string[];
}

interface OutreachStageInfo extends BaseStageInfo {
  outreachChecklist: string[];
  outreachTypes: string[];
}

interface DeliveryStageInfo extends BaseStageInfo {
  clientDeliverySteps: string[];
}

interface SystemsStageInfo extends BaseStageInfo {
  dailySystems: string[];
  tools: string[];
}

interface ScalingStageInfo extends BaseStageInfo {
  levers: string[];
  delegation: {
    phase1: string[];
    phase2: string[];
  };
}

interface Strategy {
  [key: string]: RegularStageInfo | OutreachStageInfo | DeliveryStageInfo | SystemsStageInfo | ScalingStageInfo;
}

const strategyMap: Record<BusinessType, Strategy> = {
  ecommerce: ecomStrategy,
  agency: agencyStrategy,
  software: saasStrategy,
  copywriting: copywritingStrategy
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

export const buildPrompt = (businessType: string, stage: string, data: any) => {
  // Always use the provided businessType, no fallback
  if (!businessType) {
    console.error('No business type provided to buildPrompt');
    return systemPrompt;
  }

  const strategy = strategyMap[businessType as BusinessType];
  
  if (!strategy) {
    console.error(`No strategy found for model: ${businessType}`);
    return systemPrompt;
  }

  const stageInfo = strategy[stage];
  
  if (!stageInfo) {
    console.error(`No stage info found for stage: ${stage}`);
    return systemPrompt;
  }

  const aiSupportText = stageInfo.aiSupport?.map((a: string) => `🧠 ${a}`).join("\n") || "";
  
  // Handle different stage types
  let checklist: string[] = [];
  if (stage === 'scaling') {
    checklist = (stageInfo as ScalingStageInfo).levers || [];
  } else if ('outreachChecklist' in stageInfo) {
    checklist = (stageInfo as OutreachStageInfo).outreachChecklist || [];
  } else if ('clientDeliverySteps' in stageInfo) {
    checklist = (stageInfo as DeliveryStageInfo).clientDeliverySteps || [];
  } else if ('dailySystems' in stageInfo) {
    checklist = (stageInfo as SystemsStageInfo).dailySystems || [];
  } else {
    const regularStage = stageInfo as RegularStageInfo;
    checklist = regularStage.checklist ||
      regularStage.validationChecklist ||
      regularStage.pageChecklist ||
      regularStage.testingChecklist ||
      regularStage.dailyRoutine ||
      regularStage.outreachChecklist ||
      [];
  }

  const formattedChecklist = checklist.length
    ? checklist.map((c: string) => `• ${c}`).join("\n")
    : "• No checklist available for this step.";

  const stepPrompt = stepPrompts[stage] || `Let's explore the step: ${stage}. Help the user complete it like a strategic workshop — clarify, guide, and confirm.`;

  if (stage === 'todo_list') {
    return `
      Current Stage: Todo List Management
      
      Please review the following aspects of the business plan:
      1. Business Idea Confirmation
         - Current idea: ${data.ideaConfirmation || 'Not confirmed'}
         - Validation status: ${data.validationStatus || 'Pending'}
         - Market fit: ${data.marketFit || 'To be assessed'}
      
      2. Action Steps
         - Next immediate actions: ${data.actionSteps || 'To be determined'}
         - Dependencies: ${data.dependencies || 'None identified'}
         - Timeline: ${data.timeline || 'To be established'}
      
      3. Progress Tracking
         - Completed steps: ${data.completedSteps || 'None'}
         - Current focus: ${data.currentFocus || 'Initial setup'}
         - Blockers: ${data.blockers || 'None identified'}
      
      4. Next Actions
         - Immediate next steps: ${data.nextActions || 'To be determined'}
         - Resources needed: ${data.resourcesNeeded || 'To be identified'}
         - Support required: ${data.supportRequired || 'None identified'}
      
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
🎯 Stage Objective: ${stageInfo.objective || "N/A"}
🔧 AI Support Recommendations: ${aiSupportText}

📌 Stage Checklist:
${formattedChecklist}

Prompt the user to solve the current step. Use a high-context, workshop-style question. Help them think and decide — do not move on until confirmed.

Prompt: ${stepPrompt}
`;
};

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