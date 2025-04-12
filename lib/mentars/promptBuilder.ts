import { systemPrompt } from './systemPrompt';
import { saasStrategy } from './saasStrategy';
import { copywritingStrategy } from './copywritingStrategy';
import { userProfile } from './userProfile';
import { conversationFlow } from './conversationFlow';
import { ecomStrategy } from './ecomStrategy';
import { agencyStrategy } from './agencyStrategy';

type BusinessType = 'ecommerce' | 'agency' | 'saas' | 'copywriting';

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
  saas: saasStrategy,
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

export const buildPrompt = (stage: string, step: string): string => {
  const model = (userProfile.selectedModel || 'ecommerce') as BusinessType;
  const strategy = strategyMap[model];
  const stageInfo = strategy[stage];

  const aiSupportText = stageInfo?.aiSupport?.map((a: string) => `🧠 ${a}`).join("\\n") || "";
  
  // Handle different stage types
  let checklist: string[] = [];
  if (stage === 'scaling') {
    checklist = (stageInfo as ScalingStageInfo).levers;
  } else if ('outreachChecklist' in stageInfo) {
    checklist = (stageInfo as OutreachStageInfo).outreachChecklist;
  } else if ('clientDeliverySteps' in stageInfo) {
    checklist = (stageInfo as DeliveryStageInfo).clientDeliverySteps;
  } else if ('dailySystems' in stageInfo) {
    checklist = (stageInfo as SystemsStageInfo).dailySystems;
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

  const answered = Object.entries(userProfile)
    .filter(([_, value]) => value !== null && value !== "")
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  const stepPrompt = stepPrompts[step] || `Let's explore the step: ${step}. Help the user complete it like a strategic workshop — clarify, guide, and confirm.`;

  return `
${systemPrompt}

🧠 Current Business Model: ${model.toUpperCase()}
📍 Stage: ${stage}, Step: ${step}
🎯 Stage Objective: ${stageInfo?.objective || "N/A"}
🔧 AI Support Recommendations: ${aiSupportText}


✅ User Inputs So Far:
${answered || "No responses yet."}

📌 Stage Checklist:
${formattedChecklist}

Prompt the user to solve the current step. Use a high-context, workshop-style question. Help them think and decide — do not move on until confirmed.

Prompt: ${stepPrompt}
`;
};