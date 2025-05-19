import { supabase } from "../lib/supabaseClient";


import {softwareBlueprint} from '../../lib/mentars/software-new-strat';
import {smmaBlueprint} from '../../lib/mentars/smma-new-strat';
import {copywritingBlueprint} from '../../lib/mentars/copywriting-new-strat.ts';
import {ecommerceBlueprint} from '../../lib/mentars/ecom-new-strat.ts';
import { StageData } from "../types/stage";
import { Project, StageKey } from '../types/project';
import { systemPrompt } from "./prompts.ts";

// Helper functions for extracting information from messages


// Helper functions for extracting information from messages
export const extractBudget = (text: string): string | null => {
  const sentences = text
    .split(/[.!?]+/)
    .slice(0, 2)
    .join(". ");
  return sentences.trim();
};

export const extractIncomeGoal = (text: string): string | null => {
  // Handle different formats of income goal expressions
  // Examples:
  // - "My income goal is $5,000 per month"
  // - "I want to earn $2,500 monthly"
  // - "I'd like to make 3000 dollars a month"
  // - "3k per month" or "$3k/month"
  // - "aiming for $4,000 monthly income"
  // - Simple numbers: "$50000" or "50000" or "$50,000"
  
  // Check if the message is just a number (with or without $ and commas)
  const simpleNumberPattern = /^\s*\$?(\d{1,3}(,\d{3})*|\d+)\s*$/;
  const simpleMatch = text.match(simpleNumberPattern);
  if (simpleMatch) {
    return simpleMatch[1].replace(/,/g, "");
  }
  
  // Check for dollar amount with $ sign
  const dollarSignPattern = /(?:income|revenue|earnings|goal|make|earn|aiming for|want to make|want to earn).*?\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k)/i;
  const dollarMatch = text.match(dollarSignPattern);
  
  if (dollarMatch) {
    // Handle "k" notation (e.g., $5k)
    if (dollarMatch[1].toLowerCase().endsWith('k')) {
      const numPart = dollarMatch[1].toLowerCase().replace('k', '');
      return (parseFloat(numPart) * 1000).toString();
    }
    return dollarMatch[1].replace(/,/g, "");
  }
  
  // Check for amount followed by "dollars" or "USD"
  const dollarWordPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s+)(?:dollars|usd)/i;
  const dollarWordMatch = text.match(dollarWordPattern);
  if (dollarWordMatch) {
    return dollarWordMatch[1].replace(/,/g, "");
  }
  
  // Check for 'k' notation without $ sign (e.g. "5k per month")
  const kNotationPattern = /(\d+)k\s+(?:per|a|each|monthly|every|\/)/i;
  const kNotationMatch = text.match(kNotationPattern);
  if (kNotationMatch) {
    return (parseFloat(kNotationMatch[1]) * 1000).toString();
  }
  
  // Find just standalone $ number anywhere in text
  const standaloneDollarPattern = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
  const standaloneDollarMatch = text.match(standaloneDollarPattern);
  if (standaloneDollarMatch) {
    return standaloneDollarMatch[1].replace(/,/g, "");
  }
  
  // Find just a number anywhere in text (as a last resort)
  const anyNumberPattern = /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k)\b/;
  const anyNumberMatch = text.match(anyNumberPattern);
  if (anyNumberMatch) {
    if (anyNumberMatch[1].toLowerCase().endsWith('k')) {
      const numPart = anyNumberMatch[1].toLowerCase().replace('k', '');
      return (parseFloat(numPart) * 1000).toString();
    }
    return anyNumberMatch[1].replace(/,/g, "");
  }
  
  // Last attempt: just find any number near income-related words
  const generalNumberPattern = /(?:income|revenue|earnings|goal|make|earn).*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const generalMatch = text.match(generalNumberPattern);
  if (generalMatch) {
    return generalMatch[1].replace(/,/g, "");
  }
  
  return null;
};

export const extractBusinessIdea = (text: string): string => {
  const sentences = text
    .split(/[.!?]+/)
    .slice(0, 2)
    .join(". ");
  return sentences.trim();
};

// Types needed for the functions
interface TodoItem {
  task: string;
  completed: boolean;
}

// Types for SMMA Blueprint
interface SMMAStep {
  title: string;
  criteria?: string[];
  examples?: string[];
  lowRiskAngles?: string[];
  samplePitch?: string;
  process?: string[];
  tools?: string[];
  setup?: string[];
  roles?: string[];
  contents?: string[];
  metrics?: Record<string, string>;
  checklist?: string[];
  validationChecklist?: string[];
  requirements?: string[];
  rules?: string[];
}

interface SMMAStage1 {
  objective: string;
  steps: SMMAStep[];
  deliverables?: string[];
}

interface SMMABlueprint {
  preQualification: {
    description: string;
    questions: string[];
    guidance: string;
  };
  stage_1: SMMAStage1;
  stage_2: any; // Add proper typing if needed
  stage_3: any;
  stage_4: any;
  stage_5: any;
}

// Types for Copywriting Blueprint
interface CopywritingStep {
  title: string;
  examples?: string[];
  tip?: string;
  process?: string[];
  freeWorkPriorities?: string[];
  instructions?: string[];
  offers?: Array<{
    name: string;
    description: string;
  }>;
  structure?: string[];
  checklist?: string[];
  validationChecklist?: string[];
  requirements?: string[];
  rules?: string[];
}

interface CopywritingStage1 {
  objective: string;
  steps: CopywritingStep[];
  deliverables?: string[];
}

interface CopywritingBlueprint {
  preQualification: {
    description: string;
    questions: string[];
    actions: string[];
  };
  stage_1: CopywritingStage1;
  stage_2: any; // Add proper typing if needed
  stage_3: any;
  stage_4: any;
  stage_5: any;
}

// Types for Software Blueprint
interface SoftwareStep {
  title: string;
  tools?: string[] | string;
  analysis?: string[];
  outcome?: string;
  platforms?: string[];
  strategy?: string;
  aiPrompt?: string;
  template?: string;
  validation?: string[];
  greenlight?: string;
  checklist?: string[];
  validationChecklist?: string[];
  requirements?: string[];
  rules?: string[];
}

interface SoftwareStage1 {
  objective: string;
  steps: SoftwareStep[];
  deliverables?: string[];
}

interface SoftwareBlueprint {
  preQualification: {
    description: string;
    questions: string[];
    guidance: string;
  };
  stage_1: SoftwareStage1;
  stage_2: any; // Add proper typing if needed
  stage_3: any;
  stage_4: any;
  stage_5: any;
  stage_6?: any;
}

// Type assertions for the blueprints
const typedSMMABlueprint = smmaBlueprint as SMMABlueprint;
const typedCopywritingBlueprint = copywritingBlueprint as CopywritingBlueprint;
const typedSoftwareBlueprint = softwareBlueprint as SoftwareBlueprint;

// Update the BusinessStrategy interface to include all blueprint types
export interface BusinessStrategy {
  preQualification?: {
    description: string;
    questions: string[];
    actions?: string[];
    guidance?: string;
  };
  stage_1: SMMAStage1 | CopywritingStage1 | SoftwareStage1 | any;
  stage_2: any;
  stage_3: any;
  stage_4: any;
  stage_5: any;
  stage_6?: any;
  scaling?: any;
  [key: string]: any;
}

// Update the typedSaasStrategy to use the proper type
export const typedSaasStrategy: BusinessStrategy = typedSoftwareBlueprint;

// Rename old functions to avoid conflicts
export async function generateTodosForProject(
  projectId: string,
  businessType: string,
  budget: string | null
) {
  const blueprint = getStrategyForBusinessType(businessType);
  // Use empty string as default if budget is null
  return generateTodos(projectId, budget || "", businessType, blueprint);
}

// Add type for step parameter
interface BlueprintStep {
  checklist?: string[];
  validationChecklist?: string[];
  requirements?: string[];
  rules?: string[];
  title?: string;
  goal?: string;
}

// Generic function to generate todos for any business type
export const generateTodos = async (
  projectId: string,
  budget: string,
  businessType: string,
  blueprint: BusinessStrategy,
  stage: StageKey = 'stage_1'
): Promise<any[] | null> => {
  // Get the stage data from blueprint
  const stageData = blueprint[stage];

  if (!stageData || !stageData.steps) {
    console.error(`No steps found for ${stage} in ${businessType} blueprint`);
    throw new Error(`No steps found for ${stage} in ${businessType} blueprint`);
  }

  // Get project to check for prequalification data
  const { data: project, error: getProjectError } = await supabase
    .from("projects")
    .select("outputs")
    .eq("id", projectId)
    .single();

  if (getProjectError) throw getProjectError;

  // Get prequalification answers if available
  let prequalificationInfo = "";
  let launchDateText = "";
  if (project?.outputs?.prequalification?.answers) {
    const answers = project.outputs.prequalification.answers;
    const questions = project.outputs.prequalification.questions || [];
    
    prequalificationInfo = "USER PREQUALIFICATION INFO:\n";
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      prequalificationInfo += `${questions[i]}: ${answers[i]}\n`;
      
      if (questions[i].includes("launch") || questions[i].includes("When do you wish")) {
        launchDateText = answers[i];
      }
    }
  }

  console.log('Using Blueprint for business type:', businessType);
  console.log('Blueprint stage data:', stageData.objective);
  console.log('Using prequalification info:', prequalificationInfo ? 'Yes' : 'No');

  // Create a detailed prompt from the blueprint
  let checklistItems: string[] = [];
  let deliverables: string[] = [];
  let pitfalls: string[] = [];
  
  stageData.steps.forEach((step: BlueprintStep) => {
    if (step.checklist) checklistItems.push(...step.checklist);
    if (step.validationChecklist) checklistItems.push(...step.validationChecklist);
    if (step.requirements) checklistItems.push(...step.requirements);
    if (step.rules) checklistItems.push(...step.rules);
  });
  
  if (stageData.deliverables) {
    deliverables = stageData.deliverables;
  }
  
  if (stageData.pitfalls) {
    pitfalls = stageData.pitfalls;
  }

  const todoGenerationPrompt = `As an AI ${businessType} business mentor, I need your help with two things:
  1. Generate 5 specific, actionable tasks for a ${businessType} business in ${stage.replace('_', ' ')}
  The tasks should be action items and not "How to do this" or "What to do" - they should be specific and actionable
  2. Interpret and formalize a launch date from the user's free-form text and today's date ${new Date().toISOString().split('T')[0]}

  BUDGET: ${budget}

  BUSINESS TYPE: ${businessType}

  Stage Objective: ${stageData.objective}
  
  Tasks should follow our ${businessType} blueprint and focus on:
  
  STAGE STEPS:
  ${stageData.steps.map((step: any) => 
    `- ${step.title}: ${step.description || step.goal || ''}`
  ).join('\n')}
  
  CHECKLIST ITEMS:
  ${checklistItems.map(item => `- ${item}`).join("\n")}
  
  DELIVERABLES:
  ${deliverables.map(item => `- ${item}`).join("\n")}
  
  ${pitfalls.length > 0 ? `PITFALLS TO AVOID:\n${pitfalls.map(item => `- ${item}`).join("\n")}\n` : ''}
  
  ${prequalificationInfo}

  LAUNCH DATE INTERPRETATION:
  The user has indicated their desired launch timeframe as: "${launchDateText}" and this is today's date: ${new Date().toISOString().split('T')[0]}
  Please interpret this into a specific calendar date that makes sense based on their statement.
  
  FORMAT YOUR RESPONSE AS JSON with this structure:
  {
    "tasks": [
      {"task": "Detailed task description 1", "completed": false, "stage": "${stage}", "step": null},
      {"task": "Detailed task description 2", "completed": false, "stage": "${stage}", "step": null},
      ...
    ],
    "launchDate": "YYYY-MM-DD",
    "launchDateExplanation": "Brief explanation of how you interpreted their launch timeframe"
  }

  IMPORTANT GUIDELINES:
  - Make each task ultra-specific with exact steps, tools, and websites to use
  - Generate exactly 5 tasks that perfectly match the ${businessType} business model
  - Consider the user's budget when suggesting tools or approaches
  - Reference specific platforms or tools that are industry standards for ${businessType} businesses
  - Avoid Adding numbers to the task titles
  - For the launch date, choose a reasonable date based on the user's text
  - If the launch timeframe is vague, use your judgment to select a date 60-90 days in the future
  - If no launch timeframe was provided, set a date 90 days from today i.e ${new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0]}
  - The launch date should be a valid ISO date string (YYYY-MM-DD)`;

  console.log(`Generating ${businessType} todos for stage ${stage} with launch date interpretation`);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: todoGenerationPrompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`OpenAI API Error in generate${businessType}Todos:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    console.log("Raw response:", data.choices[0].message.content);
    throw new Error("Failed to parse JSON response from API");
  }

  const todos = parsedResponse.tasks || [];
  const launchDate = parsedResponse.launchDate || null;
  const launchDateExplanation = parsedResponse.launchDateExplanation || "";
  
  console.log("Generated todos:", todos.length);
  console.log("Interpreted launch date:", launchDate);
  console.log("Launch date explanation:", launchDateExplanation);

  try {
    const updateData: any = {
      todos: todos,
      tasks_in_progress: [],
      current_stage: stage,
      total_budget: budget,
    };

    if (launchDate) {
      const isoLaunchDate = launchDate.includes('T') 
        ? launchDate 
        : new Date(launchDate).toISOString();
      
      updateData.expected_launch_date = isoLaunchDate;
      
      if (project?.outputs) {
        updateData.outputs = {
          ...project.outputs,
          launchDateInterpretation: {
            originalText: launchDateText,
            interpretedDate: launchDate,
            explanation: launchDateExplanation
          }
        };
      }
    }

    const { error: projectUpdateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (projectUpdateError) {
      throw projectUpdateError;
    }
  } catch (error) {
    console.error("Error updating project with todos and launch date:", error);
  }

  return todos;
};

// Helper function to generate a message announcing the launch date
export const generateLaunchDateMessage = async (launchDate: string, projectId?: string): Promise<string> => {
  if (!launchDate) return "";
  
  try {
    return `Thank you for completing the prequalification questions! 🎉 Your personalized tasks are now ready in the sidebar. Click on "Get Started" to begin your journey. Would you like to start with your first task?`;
  } catch (error) {
    console.error("Error formatting launch date message:", error);
    return "";
  }
};



// Get the appropriate strategy based on business type
export const getStrategyForBusinessType = (businessType: string): BusinessStrategy => {
  switch (businessType.toLowerCase()) {
    case 'software':
      return softwareBlueprint as unknown as BusinessStrategy;
    case 'agency':
      return smmaBlueprint as unknown as BusinessStrategy;
    case 'copywriting':
      return copywritingBlueprint as unknown as BusinessStrategy;
    case 'ecommerce':
      return ecommerceBlueprint as unknown as BusinessStrategy;
    default:
      return softwareBlueprint as unknown as BusinessStrategy;
  }
};





// Check if a stage is completed
export const isStageCompleted = (
  completedTasks: string[],
  stage: StageKey,
  currentStrategy: BusinessStrategy,
  todos: TodoItem[]
): boolean => {
  if (!todos) return false;

  // A stage is completed when all todos are completed
  return todos.every((todo) => completedTasks.includes(todo.task));
};

// Update todos for a new stage
export const updateTodosForStage = async (
  stage: StageKey,
  currentProject: any
) => {
  if (!currentProject) {
    console.error("No current project provided to updateTodosForStage");
    return null;
  }

  try {
    // Check API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing in updateTodosForStage");
      throw new Error("API configuration is missing");
    }
    
    // Special handling for ecommerce business
    if (currentProject.business_type?.toLowerCase() === "ecommerce") {
      return await updateEcommerceTodosForStage(stage, currentProject);
    }
    
    // For all other business types, use the original approach
    const currentStrategy = getStrategyForBusinessType(
      currentProject.business_type
    );
    
    if (!currentStrategy[stage]) {
      console.error(`No data found for stage ${stage}`);
      throw new Error(`Invalid stage: ${stage}`);
    }
    
    // Generate AI todos for the stage
    const todoGenerationPrompt = `As an AI business mentor, generate extremely detailed, step-by-step actionable tasks for stage ${stage} of building a ${
      currentProject.business_type || "general"
    } business.
    The user's budget is ${currentProject.total_budget || "not set yet"}.
    The user's business idea is ${
      currentProject.business_idea || "not set yet"
    }.

    Generate a maximum of 5 ultra-specific, actionable tasks that the user must complete for this stage.
    Each task should include exact websites, tools, or platforms to use, with specific steps.
    For example, instead of "Set up social media", say "Create a business account on Instagram by downloading the app from App Store/Google Play, clicking 'Sign Up', selecting 'Create a Business Account', and completing your profile with a 150-character bio that highlights your unique value proposition."

    Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.

    MAX 5 TASKS
    DONT GENERATE MORE THAN 5 TASKS


    Example format:
    [
      {"task": "Go to Ahrefs.com or SEMrush.com (both offer free trials) and research 3 direct competitors in your niche. Create a spreadsheet listing their top 10 ranking keywords, backlink sources, and content topics.", "completed": false},
      {"task": "Create a brand style guide using Canva.com's free templates. Define your primary and secondary colors, typography, and visual elements that will be used across all marketing materials.", "completed": false}
    ]`;

    console.log(`Generating tasks for stage ${stage} of ${currentProject.business_type} business`);

    return await generateAndSaveStageSpecificTodos(currentProject.id, stage, todoGenerationPrompt);
  } catch (error) {
    console.error("Error updating todos for stage:", error);
    return null;
  }
};

// Helper function to update ecommerce todos for a specific stage
async function updateEcommerceTodosForStage(stage: StageKey, currentProject: any) {
  // Get the specified stage data from ecommerceBlueprint
  const blueprintKey = stage as keyof typeof ecommerceBlueprint;
  
  if (!ecommerceBlueprint[blueprintKey] || blueprintKey === 'preQualification') {
    console.error(`No data found for stage ${stage} in ecommerce blueprint`);
    throw new Error(`Invalid stage: ${stage}`);
  }
  
  const stageData = ecommerceBlueprint[blueprintKey];
  
  if (!stageData || !('steps' in stageData) || !Array.isArray(stageData.steps)) {
    console.error(`No steps found for stage ${stage}`);
    return null;
  }
  
  // Create a detailed prompt from the ecommerce blueprint
  let steps: string[] = [];
  let deliverables: string[] = [];
  let pitfalls: string[] = [];
  
  // Extract data from steps
  stageData.steps.forEach((step: any) => {
    steps.push(`${step.title}: ${step.goal || ''}`);
    
    // Extract checklist items from the step
    if (step.checklist) steps.push(...step.checklist.map((item: string) => `- ${item}`));
    if (step.validationChecklist) steps.push(...step.validationChecklist.map((item: string) => `- ${item}`));
    if (step.requirements) steps.push(...step.requirements.map((item: string) => `- ${item}`));
    if (step.rules) steps.push(...step.rules.map((item: string) => `- ${item}`));
    if (step.structure) steps.push(...step.structure.map((item: string) => `- ${item}`));
  });
  
  // Get deliverables and pitfalls if available
  if ('deliverables' in stageData && Array.isArray(stageData.deliverables)) {
    deliverables = stageData.deliverables;
  }
  
  if ('pitfalls' in stageData && Array.isArray(stageData.pitfalls)) {
    pitfalls = stageData.pitfalls;
  }

  const todoGenerationPrompt = `As an AI ecommerce business mentor, generate 5 detailed, actionable tasks for stage ${stage.replace('stage_', '')} of building an ecommerce business.

  Stage Objective: ${stageData.objective}
  
  USER DETAILS:
  - Budget: ${currentProject.total_budget || "not specified"}
  - Business Idea: ${currentProject.business_idea || "general ecommerce store"}
  - Income Goal: ${currentProject.income_goal || "not specified"}
  
  STAGE DETAILS:
  ${steps.join('\n')}
  
  DELIVERABLES:
  ${deliverables.map(item => `- ${item}`).join('\n')}
  
  PITFALLS TO AVOID:
  ${pitfalls.map(item => `- ${item}`).join('\n')}
  
  Generate exactly 5 ultra-specific, actionable tasks that will help the user achieve this stage's objective.
  Each task should include exact websites, tools, or platforms to use with specific steps.
  
  For example, instead of "Set up your store", write "Sign up for Shopify (shopify.com) using the $1/month starter plan. Choose the 'Dawn' theme, set your primary brand color, and configure the navigation menu with Home, Products, and Contact pages."
  
  Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
  
  Example format:
  [
    {"task": "Sign up for Klaviyo (klaviyo.com) and connect to your Shopify store. Create a welcome email flow with 3 messages: (1) Introduction, (2) Social proof, and (3) Special offer of 15% off first purchase. Schedule these to send 0, 2, and 4 days after signup.", "completed": false},
    {"task": "Install the Product Reviews app from the Shopify App Store. Configure it to email customers 7 days after purchase asking for a review. Set up an automation to offer a 10% discount code for completed reviews.", "completed": false}
  ]`;

  console.log(`Generating ecommerce tasks for stage ${stage}`);

  return await generateAndSaveStageSpecificTodos(currentProject.id, stage, todoGenerationPrompt);
}

// Helper function to generate and save stage-specific todos
async function generateAndSaveStageSpecificTodos(projectId: string, stage: StageKey, todoGenerationPrompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: todoGenerationPrompt,
          },
        ],
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI API Error in updateTodosForStage:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
      stage,
    });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Add safety check for parsing JSON
  let generatedTodos;
  try {
    generatedTodos = JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    console.log("Raw response:", data.choices[0].message.content);
    throw new Error("Failed to parse todos from API response");
  }

  // Transform the generated todos into the correct format
  const newTodos = generatedTodos.map((todo: any) => ({
    task: todo.task,
    completed: false,
  }));

  // Update project in database
  const { error } = await supabase
    .from("projects")
    .update({
      todos: newTodos,
      current_stage: stage,
    })
    .eq("id", projectId);

  if (error) {
    console.error("Error updating todos for stage:", error);
    return null;
  }

  return newTodos;
}

// Generate business overview summary
export const generateBusinessOverviewSummary = async (currentProject: any, messages: any[]) => {
  try {
    // Check API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing in generateBusinessOverviewSummary");
      return "Business overview unavailable due to API configuration issue.";
    }

    if (!currentProject) {
      console.error("No current project provided to generateBusinessOverviewSummary");
      return "Business overview unavailable.";
    }

    const chatHistory = messages.map(msg => `${msg.is_user ? 'User' : 'AI'}: ${msg.content}`).join('\n');

    const summaryPrompt = `Based on the following chat conversation, create a concise business overview summary (max 150 characters).
    The summary should reflect the current state of the business plan and update with each new message.
    Consider the business type, main offering, target market, budget, income goal, and current progress.

    Project Details:
    - Business Type: ${currentProject.business_type || "new"}
    - Budget: ${currentProject.total_budget || "Not set"}
    - Business Idea: ${currentProject.business_idea || "Not set"}
    - Current Stage: ${
      currentProject.current_stage?.replace("_", " ").toUpperCase() ||
      "Not started"
    }
    - Completed Tasks: ${
      currentProject.todos?.filter((todo: TodoItem) => todo.completed).length || 0
    } of ${currentProject.todos?.length || 0}
    - Income Goal: ${currentProject.income_goal || "Not set"}

    Chat History:
    ${chatHistory}

    Provide a very short summary of the business based on all the information above.`;

    console.log("Generating business overview for:", currentProject.business_type);

    const summaryResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: summaryPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      }
    );

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.json().catch(() => ({}));
      console.error("OpenAI API Error in generateBusinessOverviewSummary:", {
        status: summaryResponse.status,
        statusText: summaryResponse.statusText,
        errorData,
      });
      return "Business overview temporarily unavailable.";
    }

    const summaryData = await summaryResponse.json();
    return summaryData.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating business overview:", error);
    return "Business overview temporarily unavailable.";
  }
};

// Helper function to truncate message history to fit within token limits
export const truncateMessageHistory = (messages: any[], maxTokens: number = 6000): any[] => {
  if (!messages || messages.length === 0) return [];
  
  // Rough token estimation: ~4 chars = 1 token
  const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
  
  // Keep system message and most recent messages
  const result: any[] = [];
  let tokenCount = 0;
  
  // Process messages from newest to oldest
  const reversedMessages = [...messages].reverse();
  
  // Ensure we always include at least the most recent 3 message pairs
  const guaranteedMessages = reversedMessages.slice(0, Math.min(6, reversedMessages.length));
  const remainingMessages = reversedMessages.slice(guaranteedMessages.length);
  
  // First add the guaranteed messages (most recent conversation)
  for (const msg of guaranteedMessages) {
    const msgTokens = estimateTokens(msg.content);
    tokenCount += msgTokens;
    result.unshift(msg);
  }
  
  // Then add as many older messages as possible
  for (const msg of remainingMessages) {
    const msgTokens = estimateTokens(msg.content);
    
    // If adding this message would exceed our limit, stop adding more
    if (tokenCount + msgTokens > maxTokens) {
      break;
    }
    
    tokenCount += msgTokens;
    result.unshift(msg);
  }
  
  // Add a notice as the first user message if we truncated
  if (result.length < messages.length) {
    result.unshift({
      is_user: true,
      content: "[Note: Some earlier messages were removed to fit within the conversation limits]"
    });
  }
  
  return result;
};

// Generate personas based on business type
export const getBusinessTypePersonas = (businessType: string) => {
  const commonPersonas = [
    {
      name: "Business Mentor",
      icon: "🔑",
      message: `I'm impressed with your dedication to completing this task! This shows your commitment to building your business the right way. The skills and knowledge you've gained here will serve you well as you continue to develop your business. Keep up this excellent momentum!`
    },
    {
      name: "Growth Strategist",
      icon: "📈",
      message: `By completing this task, you've unlocked new potential for your business. This accomplishment puts you ahead of 80% of entrepreneurs who often skip these essential foundation-building steps. The work you've done here will compound over time, creating long-term value for your business.`
    }
  ];

  // Business type specific personas
  const businessTypePersonas = {
    ecommerce: [
      {
        name: "E-commerce Expert",
        icon: "🛒",
        message: `As an e-commerce specialist, I can confirm that this task is crucial for building a successful online store. You're establishing strong foundations that will make scaling and optimizing your store much easier down the line. This attention to detail will directly impact your conversion rates and customer satisfaction.`
      },
      {
        name: "Digital Marketing Advisor",
        icon: "📱",
        message: `From a marketing perspective, completing this task positions your store for better visibility and customer engagement. You're building the essential infrastructure needed for effective digital marketing campaigns. This work will significantly impact your ability to acquire and retain customers efficiently.`
      }
    ],
    software: [
      {
        name: "SaaS Architect",
        icon: "🔧",
        message: `From a SaaS architecture standpoint, this task represents a critical component in building a scalable, robust software product. The technical foundation you're establishing will prevent costly rework later and enable faster iteration as you evolve your product.`
      },
      {
        name: "Product Development Coach",
        icon: "🚀",
        message: `As a product development expert, I can see that completing this task puts you firmly on the path to product-market fit. You're taking the right steps to validate assumptions and build features that truly matter to users, which is exactly what successful software founders do.`
      }
    ],
    agency: [
      {
        name: "Agency Scaling Expert",
        icon: "🏢",
        message: `In the agency world, this task is what separates freelancers from true agency owners. You're building systems and processes that will allow you to scale beyond trading time for money, creating leverage that will multiply your impact and revenue.`
      },
      {
        name: "Client Acquisition Specialist",
        icon: "🤝",
        message: `From a business development perspective, this task strengthens your ability to attract and onboard ideal clients. You're laying the groundwork for consistent lead generation and client retention, the lifeblood of any successful agency.`
      }
    ],
    copywriting: [
      {
        name: "Copy Chief",
        icon: "✍️",
        message: `As a senior copywriter, I recognize that this task enhances your positioning as an expert rather than just another writer. You're building the framework that will allow you to command premium rates and attract clients who value strategic communication.`
      },
      {
        name: "Brand Messaging Consultant",
        icon: "💬",
        message: `From a brand perspective, completing this task elevates your offering beyond words on a page to strategic communication that drives business results. This is exactly the approach that will make clients see you as an invaluable partner rather than a replaceable service provider.`
      }
    ]
  };

  // Get the right personas based on business type
  const businessSpecificPersonas = businessTypePersonas[businessType as keyof typeof businessTypePersonas] || [];
  
  // Combine common personas with business-specific ones and return 3-4 personas
  return [...businessSpecificPersonas, ...commonPersonas].slice(0, 4);
};

// Generate detailed task completion messages with multiple personas
export const generateDetailedTaskCompletionMessage = (
  taskNumber: number,
  taskDescription: string,
  nextTaskNumber?: number,
  nextTaskDescription?: string,
  businessType: string = "software"
): string => {
  // Get personas specific to the business type
  const personas = getBusinessTypePersonas(businessType);

  // Construct the detailed message
  let message = `## 🎉 Congratulations on completing Task #${taskNumber}! 🎉\n\n`;
  
  // Only include task description if it's not a placeholder text
  if (taskDescription !== "Moving to next task" && taskDescription !== "All tasks completed") {
    message += `You've successfully completed: **${taskDescription}**\n\n`;
  }
  
  // Add the persona perspectives
  personas.forEach(persona => {
    message += `### ${persona.icon} ${persona.name} Perspective:\n${persona.message}\n\n`;
  });

  // Add the milestone achievement message
  message += `## 🏆 Milestone Achievement\n\n`;
  message += `You're making excellent progress in your entrepreneurial journey. Each completed task brings you closer to building a sustainable and profitable business. This structured approach ensures you're building on solid foundations.\n\n`;

  // Add the next task information if available
  if (nextTaskNumber !== undefined && nextTaskDescription) {
    message += `## Your Next Task:\n\n`;
    message += `**Task #${nextTaskNumber}: ${nextTaskDescription}**\n\n`;
    message += `Would you like me to help you with this task?`;
  } else {
    message += `## Stage Complete!\n\n`;
    message += `Congratulations! You've completed all the tasks for this stage. This is a significant milestone in your business journey.\n\n`;
    message += `Would you like to move to the next stage?`;
  }

  return message;
};

// Get AI chat response
export const getAIChatResponse = async (
  messages: any[],
  userMessage: string,
  currentProject: any,
  model: string = "gpt-4" // Add default model parameter
) => {
  try { 
    if (!currentProject) {
      console.error("No current project provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your request because no project information was provided.";
    }

    console.log('Current Project:', currentProject);

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages array provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your previous messages correctly.";
    }

    if (!userMessage) {
      console.error("No user message provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process an empty message.";
    }

    // First, handle automatic task completion if the message indicates completion
    if (isTaskCompletionMessage(userMessage) && currentProject.todos) {
      try {
        // Find the first incomplete task
        const firstIncompleteIndex = currentProject.todos.findIndex((todo: any) => !todo.completed);
        
        if (firstIncompleteIndex !== -1) {
          // Mark this task as completed in the project
          const updatedTodos = [...currentProject.todos];
          updatedTodos[firstIncompleteIndex] = {
            ...updatedTodos[firstIncompleteIndex],
            completed: true
          };
          
          // Update the project in the database
          await supabase
            .from("projects")
            .update({ todos: updatedTodos })
            .eq("id", currentProject.id);
          
          // Update the local copy of the project with completed task
          currentProject = {
            ...currentProject,
            todos: updatedTodos
          };
          
          // Look for the next task to suggest (now that we've marked the current one complete)
          const nextIncompleteIndex = updatedTodos.findIndex((todo: any) => !todo.completed);
          
          if (nextIncompleteIndex !== -1) {
            const completedTaskNumber = firstIncompleteIndex + 1;
            const nextTaskNumber = nextIncompleteIndex + 1;
            
            // Use the detailed completion message instead of the simple one
            return generateDetailedTaskCompletionMessage(
              completedTaskNumber,
              updatedTodos[firstIncompleteIndex].task,
              nextTaskNumber,
              updatedTodos[nextIncompleteIndex].task,
              currentProject.business_type
            );
          } else {
            // All tasks completed
            return generateDetailedTaskCompletionMessage(
              firstIncompleteIndex + 1,
              updatedTodos[firstIncompleteIndex].task,
              undefined,
              undefined,
              currentProject.business_type
            );
          }
        }
      } catch (error) {
        console.error("Error handling task completion message:", error);
        // Continue with normal response if there was an error
      }
    }

    // Get the current blueprint based on business type
    const blueprint = getStrategyForBusinessType(currentProject.business_type);
    
    // Check if the user message is about a todo task or help request
    const isTaskRequest = userMessage.toLowerCase().includes("can you help") ||
      userMessage.toLowerCase().includes("how do i") || 
      userMessage.includes("how to") ||
      userMessage.toLowerCase().includes("could you assist") || 
      userMessage.toLowerCase().includes("guide me") ||
      userMessage.toLowerCase().includes("help me complete this task") ||
      userMessage.toLowerCase().includes("help me");

    // Check if user has pasted a todo task from the list
    let isExactTodoTask = false;
    let matchedTodoIndex = -1;
    
    if (currentProject.todos && Array.isArray(currentProject.todos)) {
      for (let i = 0; i < currentProject.todos.length; i++) {
        const todo = currentProject.todos[i];
        if (todo.task.toLowerCase() === userMessage.toLowerCase() ||
            userMessage.toLowerCase().includes(todo.task.toLowerCase())) {
          isExactTodoTask = true;
          matchedTodoIndex = i;
          break;
        }
      }
    }

    // If the user's message contains "I want to work on Todo #X", extract the task number
    const todoRequestRegex = /I want to work on Todo #(\d+):/i;
    const todoRequestMatch = userMessage.match(todoRequestRegex);
    if (todoRequestMatch && currentProject.todos) {
      const requestedTaskNumber = parseInt(todoRequestMatch[1]) - 1; // Convert to 0-indexed
      if (requestedTaskNumber >= 0 && requestedTaskNumber < currentProject.todos.length) {
        matchedTodoIndex = requestedTaskNumber;
        isExactTodoTask = true;
      }
    }

    // Get information about completed tasks and current stage
    const completedTaskCount = currentProject.todos?.filter((todo: any) => todo.completed).length || 0;
    const totalTaskCount = currentProject.todos?.length || 0;
    const currentStage = currentProject.current_stage || "stage_1";
    
    // Find the first incomplete task (the current focus task)
    const currentFocusTask = currentProject.todos?.find((todo: any) => !todo.completed);
    const currentFocusTaskIndex = currentProject.todos?.findIndex((todo: any) => !todo.completed);
    
    // Get stage and step information from the blueprint
    const currentStageData = blueprint[currentStage];
    let currentStepData = null;
    if (currentStageData?.steps && currentProject.current_step) {
      currentStepData = currentStageData.steps.find((step: any) => 
        step.title === currentProject.current_step
      );
    }
    
    // Create a detailed business context
    const businessTypeContext = `You are helping the user build a ${
    currentProject.business_type || "business"
    } business.
    The user's budget is ${currentProject.total_budget || "not set yet"}.
    The user's business idea is ${
      currentProject.business_idea || "not set yet"
    }.
    The user's income goal is ${currentProject.income_goal || "not set yet"}.
    
    Current Progress:
    - Stage: ${currentStage.replace('_', ' ').toUpperCase()}
    - Completed Tasks: ${completedTaskCount} of ${totalTaskCount}
    - Next Task to Focus On: ${currentFocusTask ? `#${currentFocusTaskIndex + 1} - ${currentFocusTask.task}` : "All tasks completed"}
    
    Blueprint Details:
    - Business Type: ${currentProject.business_type}
    - Current Stage Objective: ${currentStageData?.objective || "Not available"}
    - Current Step: ${currentStepData?.title || "Not specified"}
    - Step Description: ${currentStepData?.description || currentStepData?.goal || "Not available"}

    IMPORTANT INSTRUCTIONS:
    1. DO NOT ask questions about business type, budget, business idea, or income goals - this information is already provided above.
    2. DO NOT ask for context about the business - use the information provided above.
    3. Only ask specific questions related to the immediate task or problem the user needs help with.
    4. Focus on providing direct, actionable solutions based on the context you already have.
    5. ALWAYS format your responses using React-Markdown format so they render properly in the interface.
    6. If a user is trying to work on tasks out of order, encourage them to complete earlier tasks first.
    7. DO NOT move to another step or todo until the current one is fully completed and you have confirmation from the user.
    8. Always reference todo items by their number (e.g., "Todo #3") when discussing them.
    9. Always prompt the user with 2-3 specific questions to ensure extreme detail in their task completion.
    10. Make your responses helpful and action-oriented, focusing on helping the user make tangible progress.
    11. DIRECTLY SOLVE USER TASKS. DO NOT just give guidance on how to do it. Provide actual solutions, content, and completed work.
    12. When suggesting ANY type of recommendations (personas, customer segments, product ideas, business names, marketing strategies, etc.), you MUST ALWAYS:
        a. Provide exactly 3-5 specific options/suggestions (never more, never less)
        b. For EACH option, calculate and display a simple success rate percentage (0-100%) based on:
           - Market saturation
           - Budget requirements
           - Market size
           - Unique selling proposition
           - Cash flow potential
        c. Format each suggestion as:
           ### Option 1: [Name/Title]
           [Brief description of the option - at least 3-4 sentences with specific details]
           
           **Success Rate: XX%**
           
           This option has a XX% chance of success based on market analysis, budget requirements, market size, unique selling proposition, and cash flow potential.
        d. ALWAYS conclude by recommending the option with the highest success rate
        e. For product ideas specifically, emphasize the success rate prominently in your recommendation
    13. If a user proposes a new idea, evaluate it using the same success rate methodology and compare it with previous options.
    14. When a user selects or shows interest in a lower-scoring option (not the highest-scoring one):
        a. Express diplomatic concern about their choice
        b. Point out that the higher success rate option offers better chances of success
        c. ALWAYS include the success rate percentage
        d. Say something like: "I notice you're interested in [Option X] with a [Y]% success rate. Before proceeding, I'd like to highlight that [Highest Success Rate Option] has a [Z]% success rate, which is [Z-Y]% higher, indicating a stronger potential for success."
        e. For product ideas, explicitly state the difference in success rates
        f. Always ASK if they'd like to reconsider their choice
        g. If they insist on the lower-scoring option, respect their choice but periodically remind them of the challenges
    15. Always keep users focused on completing the current todo item before moving to the next one.
    16. Don't generate images or logos, only provide text-based content.
    17. PROVIDE EXTREMELY DETAILED AND ELABORATE SOLUTIONS to each task. Never be generic or high-level. Include specific examples, templates, and actionable items.
    18. After providing a solution for a task, ALWAYS ask if the user wants to mark it as complete.
    
    ${isExactTodoTask || isTaskRequest ? 
      `IMPORTANT: The user is asking for help with a specific task or has pasted a todo item from their list.
      You MUST directly solve their task, not just provide guidance on how to do it.
      DO NOT say phrases like "Here's how to do this" or "Step-by-step way to do this".
      Instead, DIRECTLY give them the solution, exact content, templates, or completed work they need.
      For example:
      - If they need marketing copy, WRITE the actual marketing copy (at least 300-500 words)
      - If they need a business plan, CREATE the actual business plan (with all sections filled out)
      - If they need a competitor analysis, PROVIDE the complete analysis with real data and insights
      - If they need a pricing strategy, DEVELOP the full pricing model with specific price points
      - If they need customer personas, create 3-5 detailed personas with success rates (at least 150 words each)

      ALWAYS provide comprehensive solutions that can be used immediately without further work needed.
      
      If the task is about researching something, DO THE RESEARCH FOR THEM and provide a complete report/analysis.
      
      When providing ANY type of recommendations or multiple options (personas, business ideas, marketing strategies, etc.), you MUST ALWAYS:
      1. Provide exactly 3-5 specific options/suggestions (never more, never less)
      2. For EACH option, calculate and display a simple success rate percentage (0-100%) based on:
         - Market saturation
         - Budget requirements
         - Market size
         - Unique selling proposition
         - Cash flow potential
      3. Format each suggestion as:
         ### Option 1: [Name/Title]
         [DETAILED description of the option - at least 150 words with specific details]
         
         **Success Rate: XX%**
         
         *Market saturation:* [Specific analysis]
         *Budget requirements:* [Specific analysis]
         *Market size:* [Specific analysis]
         *Unique selling proposition:* [Specific analysis]
         *Cash flow potential:* [Specific analysis]
         
         This option has a XX% chance of success overall.
      
      4. After presenting all options with their success rates, ALWAYS:
         a. Conclude by STRONGLY recommending the option with the highest success rate
         b. If they later express interest in a lower-scoring option, diplomatically express concern
         c. Point out that the higher success rate option offers better chances of success
         d. ALWAYS include the success rate percentage
         e. For product ideas, explicitly state the difference in success rates
         f. Ask if they'd like to reconsider with something like: "I notice you're interested in [Option X] with a [Y]% success rate. Before proceeding, I'd like to highlight that [Highest Success Rate Option] has a [Z]% success rate, which is [Z-Y]% higher, indicating a stronger potential for success. Would you like to reconsider?"
         g. If they still insist on a lower-scoring option, respect their choice but periodically remind them of the challenges

      Provide the FINISHED WORK they need, not just instructions on how to do it themselves.
      Include specific information, examples, and completed templates that they can use immediately.

      At the end of your response, add a success indicator tag that will be used to automatically mark the task as complete. Add this line:
      [TASK_COMPLETE_INDICATOR: ${matchedTodoIndex !== -1 ? `TASK_${matchedTodoIndex}` : 'CURRENT_TASK'}]

      Remember to format your response using React-Markdown syntax for proper rendering.` :
      `Remember to format your response using React-Markdown syntax for proper rendering.`
    }`;

    // Log details for debugging
    console.log("API Request details:");
    console.log("- Business type:", currentProject.business_type);
    console.log("- Message count:", messages.length);
    console.log("- System prompt length:", systemPrompt.length);
    console.log("- Is task request:", isTaskRequest);
    console.log("- Is exact todo task:", isExactTodoTask);
    console.log("- Current focus task:", currentFocusTask?.task || "None");
    console.log("- Matched todo index:", matchedTodoIndex);
    console.log("- Using model:", model);
    
    // Check API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return "I apologize, but I can't process your request because the API configuration is missing. Please contact support.";
    }
    
    // Truncate message history to fit within token limits
    // Reserve ~2000 tokens for system prompt and latest user message
    const truncatedMessages = truncateMessageHistory(messages, 6000);
    console.log(`Truncated message history from ${messages.length} to ${truncatedMessages.length} messages`);
    
    // Prepare request body
    const requestBody = {
      model: model, // Use the provided model parameter
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\n${businessTypeContext}`,
        },
        ...truncatedMessages.map((msg) => ({
          role: msg.is_user ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
    };

    const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("API response received successfully");
          let aiResponse = data.choices[0].message.content;
          
          // If there's a task completion indicator, mark the task as complete
          const taskCompleteRegex = /\[TASK_COMPLETE_INDICATOR: (TASK_\d+|CURRENT_TASK)\]/;
          const taskCompleteMatch = aiResponse.match(taskCompleteRegex);
          
          if (taskCompleteMatch) {
            const taskIndicator = taskCompleteMatch[1];
            let taskIndexToComplete = -1;
            
            if (taskIndicator === 'CURRENT_TASK') {
              // Find the first incomplete task
              const nextIncompleteIndex = currentProject.todos.findIndex((todo: any) => !todo.completed);
              if (nextIncompleteIndex !== -1) {
                taskIndexToComplete = nextIncompleteIndex;
              }
            } else {
              // Extract index from TASK_X format
              const indexMatch = taskIndicator.match(/TASK_(\d+)/);
              if (indexMatch) {
                taskIndexToComplete = parseInt(indexMatch[1]);
              }
            }
            
            console.log("Task completion indicator found:", { 
              taskIndicator, 
              taskIndexToComplete,
              todoCount: currentProject.todos?.length || 0
            });
            
            // Mark the task as complete
            if (taskIndexToComplete !== -1 && currentProject.todos[taskIndexToComplete]) {
              try {
                console.log("Marking task as complete:", currentProject.todos[taskIndexToComplete].task);
                
                const todoId = currentProject.todos[taskIndexToComplete].id;
                const updatedTodos = [...currentProject.todos];
                updatedTodos[taskIndexToComplete] = {
                  ...updatedTodos[taskIndexToComplete],
                  completed: true
                };
                
                // Update todos in the database
                const { error } = await supabase
                  .from("projects")
                  .update({ todos: updatedTodos })
                  .eq("id", currentProject.id);
                
                if (error) {
                  console.error("Error updating todo completion status:", error);
                } else {
                  console.log("Task marked as complete successfully");
                  
                  // Check if all tasks are now completed to trigger stage transition
                  const allTasksCompleted = updatedTodos.every((todo: any) => todo.completed);
                  
                  if (allTasksCompleted) {
                    console.log("All tasks completed, should trigger stage transition");
                  }
                }
                
                // Remove the indicator from the response
                aiResponse = aiResponse.replace(taskCompleteRegex, '');
                
                // Add a completion confirmation
                aiResponse += "\n\n**✅ I've marked this task as complete for you.**";
                
                // If there are more tasks to do, suggest the next one
                if (taskIndexToComplete < currentProject.todos.length - 1) {
                  const nextTaskIndex = taskIndexToComplete + 1;
                  aiResponse += `\n\nYour next task is: **Task #${nextTaskIndex + 1}: ${currentProject.todos[nextTaskIndex].task}**\n\nWould you like me to help you with this task?`;
                } else {
                  // This was the last task
                  aiResponse += "\n\n**🎉 Congratulations! You've completed all tasks in this stage. You can now move to the next stage.**";
                }
              } catch (error) {
                console.error("Error marking task as complete:", error);
              }
            }
          }
          
          return aiResponse;
        }
        

    throw new Error("Failed to get AI response after multiple attempts");
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "I apologize, but I encountered an error with my AI service. The server might be busy. Please try again in a moment or contact support if the issue persists.";
  }
};

// Get next stage
export const getNextStage = (currentStage: StageKey): StageKey | null => {
  const stages: StageKey[] = [
    'preStartFitCheck',
    'preStartEvaluation',
    'preQualification',
    'stage_1',
    'stage_2',
    'stage_3',
    'stage_4',
    'stage_5',
    'scaling'
  ];
  
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
};

// Check if a task is out of order (attempting to complete without completing previous tasks)
export const isTaskOutOfOrder = (
  todoList: any[], // Array of todo items
  referencedTaskIndex: number // Index of the task being referenced
): boolean => {
  // If it's the first task or invalid index, it's not out of order
  if (referencedTaskIndex <= 0 || referencedTaskIndex >= todoList.length) {
    return false;
  }

  // Check if all previous tasks are completed
  for (let i = 0; i < referencedTaskIndex; i++) {
    if (!todoList[i].completed) {
      return true; // Found an incomplete task before the referenced one
    }
  }

  return false; // All previous tasks are completed
};

// Get the next incomplete todo task that should be worked on
export const getNextIncompleteTodo = (todoList: any[]): any | null => {
  if (!todoList || todoList.length === 0) {
    return null;
  }
  
  // Find the first incomplete task
  for (let i = 0; i < todoList.length; i++) {
    if (!todoList[i].completed) {
      return { task: todoList[i], index: i };
    }
  }
  
  return null; // All tasks are completed
};

// Find the todo task by task text with fuzzy matching
export const findTodoTaskByText = (todoList: any[], taskText: string | null): any | null => {
  if (!todoList || todoList.length === 0 || !taskText) {
    return null;
  }
  
  // First, clean the input text by removing typical prefixes users might add
  const cleanTaskText = taskText.replace(/^(i want to (work on|do|complete)|help me with|let(')?s work on|how (do|can) i|please help( me)? with|i need help with|task #?\d+:?\s*)/i, '').trim();
  
  // Try exact match first (case insensitive)
  let task = todoList.find(todo => 
    todo.task.toLowerCase() === cleanTaskText.toLowerCase()
  );
  
  if (task) {
    const index = todoList.findIndex(todo => todo.task === task.task);
    return { task, index };
  }
  
  // If no exact match, check if the task text contains the entire todo task
  task = todoList.find(todo => 
    cleanTaskText.toLowerCase().includes(todo.task.toLowerCase())
  );
  
  if (task) {
    const index = todoList.findIndex(todo => todo.task === task.task);
    return { task, index };
  }
  
  // If still no match, try to find a todo that is largely contained in the message
  // This handles cases where the user paraphrases or only mentions part of the task
  const todoWithMostWords = todoList
    .map(todo => {
      const todoWords = todo.task.toLowerCase().split(/\s+/);
      const messageWords = cleanTaskText.toLowerCase().split(/\s+/);
      
      // Count how many words from the todo appear in the message
      const matchedWords = todoWords.filter((word: string) => 
        // Skip very short words and common articles/prepositions
        word.length > 3 && 
        !['the', 'and', 'for', 'with', 'your'].includes(word) && 
        messageWords.includes(word)
      );
      
      const matchScore = matchedWords.length / todoWords.length;
      return { todo, matchScore };
    })
    .filter(item => item.matchScore > 0.4) // Must match at least 40% of words
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by highest match score
    .shift(); // Take the best match
  
  if (todoWithMostWords) {
    const index = todoList.findIndex(todo => todo.task === todoWithMostWords.todo.task);
    return { task: todoWithMostWords.todo, index };
  }
  
  // Check if the message mentions any todo by number
  const todoNumberRegex = /todo\s+#?(\d+)|task\s+#?(\d+)|(\d+)(st|nd|rd|th)\s+todo|(\d+)(st|nd|rd|th)\s+task/i;
  const match = taskText.match(todoNumberRegex);

  if (match) {
    const todoNumber = parseInt(match[1] || match[2] || match[3] || match[5]) - 1; // Convert to 0-indexed
    if (todoNumber >= 0 && todoNumber < todoList.length) {
      return { task: todoList[todoNumber], index: todoNumber };
    }
  }

  return null;
};

// Helper function to calculate a success score for a suggestion
export interface SuccessScoreItem {
  name: string;
  description: string;
  marketSaturation: {
    score: number;
    reason: string;
  };
  budgetRequirements: {
    score: number;
    reason: string;
  };
  marketSize: {
    score: number;
    reason: string;
  };
  uniqueSellingProposition: {
    score: number;
    reason: string;
  };
  cashFlowPotential: {
    score: number;
    reason: string;
  };
}

export const calculateSuccessScore = (item: SuccessScoreItem): number => {
  // Validate scores are within 0-20 range
  const validateScore = (score: number): number => {
    if (score < 0) return 0;
    if (score > 20) return 20;
    return score;
  };

  // Calculate the total score
  const total = 
    validateScore(item.marketSaturation.score) +
    validateScore(item.budgetRequirements.score) +
    validateScore(item.marketSize.score) +
    validateScore(item.uniqueSellingProposition.score) +
    validateScore(item.cashFlowPotential.score);
    
  return total;
};

// Format a suggestion with its success score details for display
export const formatSuggestionWithScore = (item: SuccessScoreItem): string => {
  const totalScore = calculateSuccessScore(item);
  const successRate = Math.round((totalScore / 100) * 100); // Convert to percentage
  
  return `### ${item.name}
${item.description}

**Success Rate: ${successRate}%**

This option has a ${successRate}% chance of success based on market analysis, budget requirements, market size, unique selling proposition, and cash flow potential.`;
};

// Format multiple suggestions with success scores and provide a recommendation
export const formatSuggestionsWithRecommendation = (items: SuccessScoreItem[]): string => {
  if (!items || items.length === 0) {
    return "No suggestions available.";
  }
  
  // Calculate scores for all items
  const scoredItems = items.map(item => ({
    ...item,
    totalScore: calculateSuccessScore(item)
  }));
  
  // Sort by score (highest first)
  scoredItems.sort((a, b) => b.totalScore - a.totalScore);
  
  // Generate the formatted suggestions
  const formattedSuggestions = scoredItems.map(item => formatSuggestionWithScore(item)).join("\n\n");
  
  // Add recommendation
  const successRate = Math.round((scoredItems[0].totalScore / 100) * 100); // Convert to percentage
  
  const recommendation = `
## Recommendation
Based on the success rate analysis, I STRONGLY recommend **${scoredItems[0].name}** with a **${successRate}% success rate** as your best option. This option offers the strongest potential for success in your market.

If you choose a different option with a lower success rate, you'll likely face more challenges and a lower probability of success. The higher success rate indicates a more favorable business environment and better alignment with your goals.

**Each 10% difference in success rate roughly translates to a 10% higher chance of success in the real world.**`;
  
  return formattedSuggestions + recommendation;
};

// Generate a warning message when a user selects a lower-scoring option
export const generateLowerScoreWarning = (
  selectedOption: SuccessScoreItem,
  bestOption: SuccessScoreItem
): string => {
  const selectedScore = calculateSuccessScore(selectedOption);
  const bestScore = calculateSuccessScore(bestOption);
  
  // Calculate success rates (as percentages)
  const selectedSuccessRate = Math.round((selectedScore / 100) * 100);
  const bestSuccessRate = Math.round((bestScore / 100) * 100);
  const successRateDifference = bestSuccessRate - selectedSuccessRate;
  
  // Craft the message based on the success rate difference
  let message = `I notice you're interested in **${selectedOption.name}** with a ${selectedSuccessRate}% success rate. `;
  
  if (successRateDifference >= 20) {
    // Significant difference
    message += `Before proceeding, I'd like to express significant concern about this choice. **${bestOption.name}** has a ${bestSuccessRate}% success rate, which is ${successRateDifference}% higher, indicating a much stronger potential for success.`;
  } else if (successRateDifference >= 10) {
    // Moderate difference
    message += `Before proceeding, I'd like to highlight that **${bestOption.name}** has a ${bestSuccessRate}% success rate, which is ${successRateDifference}% higher, indicating a noticeably better chance of success.`;
  } else {
    // Minor difference
    message += `Before proceeding, I'd like to note that **${bestOption.name}** has a ${bestSuccessRate}% success rate, which is ${successRateDifference}% higher, suggesting somewhat better potential.`;
  }
  
  message += ` Would you like to reconsider your choice?`;
  
  return message;
};

// Update the todo generation functions to use the typed blueprints
export async function generateTodosForStage(stage: StageKey, currentProject: any) {
  if (!currentProject) {
    console.error("No current project provided to generateTodosForStage");
    return null;
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key is missing in generateTodosForStage");
    return null;
  }

  try {
    const { business_type, id: projectId, total_budget: budget } = currentProject;

    switch (business_type) {
      case 'ecommerce':
        return await generateEcommerceTodos(projectId, budget);
      case 'agency':
        return await generateSMMATodos(projectId, budget);
      case 'copywriting':
        return await generateCopywritingTodos(projectId, budget);
      case 'software':
        return await generateSoftwareTodos(projectId, budget);
      default:
        console.error(`Unsupported business type: ${business_type}`);
        return null;
    }
  } catch (error) {
    console.error("Error in generateTodosForStage:", error);
    return null;
  }
}

// Business-specific todo generation functions
export const generateSMMATodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'agency', smmaBlueprint as unknown as BusinessStrategy);
};

export const generateCopywritingTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'copywriting', copywritingBlueprint as unknown as BusinessStrategy);
};

export const generateSoftwareTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'software', softwareBlueprint as unknown as BusinessStrategy);
};

export const generateEcommerceTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'ecommerce', ecommerceBlueprint as unknown as BusinessStrategy);
};

// Check if a message indicates task completion
export const isTaskCompletionMessage = (message: string): boolean => {
  const completionPhrases = [
    /\bcompleted\b/i,
    /\bdone\b/i,
    /\bfinished\b/i,
    /\bi did it\b/i,
    /\bmarked as complete\b/i,
    /\bcompleted task\b/i,
    /\bfinished task\b/i,
    /\bcomplete\b/i,
    /\btask completed\b/i,
    /\bi'm done\b/i,
    /\bi am done\b/i,
    /\bi have completed\b/i,
    /\bi have finished\b/i,
    /\bi've completed\b/i,
    /\bi've finished\b/i,
    /\bi finished\b/i,
    /\bi completed\b/i,
  ];

  return completionPhrases.some(regex => regex.test(message));
};

// Check if a message is asking about the next task
export const isNextTaskRequest = (message: string): boolean => {
  const nextTaskPhrases = [
    /\bnext task\b/i,
    /\bwhat'?s next\b/i,
    /\bwhat should i do next\b/i,
    /\bnext step\b/i,
    /\bwhat now\b/i,
    /\bcontinue\b/i,
    /\bproceed\b/i,
    /\bwhat'?s the next task\b/i,
    /\bwhat'?s the next step\b/i,
    /\bwhat'?s my next task\b/i,
    /\bwhat do i do now\b/i,
    /\blet'?s move on\b/i,
    /\bnext todo\b/i,
    /\bmove on\b/i,
    /\bwhat'?s after this\b/i,
  ];

  return nextTaskPhrases.some(regex => regex.test(message));
}; 