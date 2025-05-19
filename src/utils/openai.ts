import { supabase } from "../lib/supabaseClient";


import {softwareBlueprint} from '../../lib/mentars/software-new-strat';
import {smmaBlueprint} from '../../lib/mentars/smma-new-strat';
import {copywritingBlueprint} from '../../lib/mentars/copywriting-new-strat.ts';
import {ecommerceBlueprint} from '../../lib/mentars/ecom-new-strat.ts';
import { StageData } from "../types/stage";
import { Project, StageKey } from '../types/project';

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
  budget: string
) {
  const blueprint = getStrategyForBusinessType(businessType);
  return generateTodos(projectId, budget, businessType, blueprint);
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

  console.log('Using Blueprint:', blueprint);
console.log('Using PREQUALIFICATION INFO' , prequalificationInfo)



  // Create a detailed prompt from the blueprint
  let checklistItems: string[] = [];
  let deliverables: string[] = [];
  
  stageData.steps.forEach((step: BlueprintStep) => {
    if (step.checklist) checklistItems.push(...step.checklist);
    if (step.validationChecklist) checklistItems.push(...step.validationChecklist);
    if (step.requirements) checklistItems.push(...step.requirements);
    if (step.rules) checklistItems.push(...step.rules);
  });
  
  if (stageData.deliverables) {
    deliverables = stageData.deliverables;
  }

  const todoGenerationPrompt = `As an AI ${businessType} business mentor, I need your help with two things:
  1. Generate 5 specific, actionable tasks for starting a ${businessType} business
  2. Interpret and formalize a launch date from the user's free-form text and today's date ${new Date().toISOString().split('T')[0]}

  BUDGET: ${budget}

  Stage Objective: ${stageData.objective}
  
  Tasks should follow our ${businessType} blueprint and focus on:
  
  CHECKLIST ITEMS:
  ${checklistItems.map(item => `- ${item}`).join("\n")}
  
  DELIVERABLES:
  ${deliverables.map(item => `- ${item}`).join("\n")}
  
  ${prequalificationInfo}

  LAUNCH DATE INTERPRETATION:
  The user has indicated their desired launch timeframe as: "${launchDateText}" and this is today's date: ${new Date().toISOString().split('T')[0]}
  Please interpret this into a specific calendar date that makes sense based on their statement.
  
  FORMAT YOUR RESPONSE AS JSON with this structure:
  {
    "tasks": [
      {"task": "Detailed task description 1", "completed": false},
      {"task": "Detailed task description 2", "completed": false},
      ...
    ],
    "launchDate": "YYYY-MM-DD",
    "launchDateExplanation": "Brief explanation of how you interpreted their launch timeframe"
  }

  IMPORTANT GUIDELINES:
  - Make each task ultra-specific with exact steps, tools, and websites to use
  - Generate exactly 5 tasks
  - Avoid Adding numbers to the task titles
  - For the launch date, choose a reasonable date based on the user's text
  - If the launch timeframe is vague, use your judgment to select a date 60-90 days in the future
  - If no launch timeframe was provided, set a date 90 days from today i.e ${new Date().toISOString().split('T')[0]}
  - The launch date should be a valid ISO date string (YYYY-MM-DD)`;

  console.log(`Generating initial ${businessType} todos with launch date interpretation`);
  console.log("- Budget:", budget);
  console.log("- Prequalification includes launch date text:", !!launchDateText);

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

// Get AI chat response
export const getAIChatResponse = async (
  messages: any[],
  userMessage: string,
  currentProject: any,
  systemPrompt: string
) => {
  try {
    // Input validation
    if (!currentProject) {
      console.error("No current project provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your request because no project information was provided.";
    }

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages array provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your previous messages correctly.";
    }

    if (!userMessage?.trim()) {
      console.error("No user message provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process an empty message.";
    }

    // API key validation
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return "I apologize, but I can't process your request because the API configuration is missing. Please contact support.";
    }

    // Get current task information
    const completedTaskCount = currentProject.todos?.filter((todo: any) => todo.completed).length || 0;
    const totalTaskCount = currentProject.todos?.length || 0;
    const currentStage = currentProject.current_stage || "stage_1";
    const currentFocusTask = currentProject.todos?.find((todo: any) => !todo.completed);
    const currentFocusTaskIndex = currentProject.todos?.findIndex((todo: any) => !todo.completed) ?? -1;

    // Check for task jumping
    const isTaskRequest = userMessage.toLowerCase().includes("can you help") ||
      userMessage.toLowerCase().includes("how do i") || 
      userMessage.toLowerCase().includes("how to") ||
      userMessage.toLowerCase().includes("could you assist") || 
      userMessage.toLowerCase().includes("guide me") ||
      userMessage.toLowerCase().includes("help me complete this task") ||
      userMessage.toLowerCase().includes("help me");

    if (isTaskRequest) {
      const requestedTaskIndex = currentProject.todos?.findIndex((todo: any) => 
        userMessage.toLowerCase().includes(todo.task.toLowerCase())
      ) ?? -1;

      if (requestedTaskIndex > currentFocusTaskIndex) {
        return `I notice you're asking about a future task. To maintain proper progress and ensure success, we need to complete the current task first:

**Current Task #${currentFocusTaskIndex + 1}**: ${currentFocusTask?.task}

Would you like help with this task? Once we complete it, we can move on to the next one.`;
      }
    }

    // Construct the system context
    const systemContext = {
      role: "system",
      content: `${systemPrompt}

You are an AI business assistant actively executing tasks for the user's ${currentProject.business_type} business.

CURRENT STATE:
- Current Stage: ${currentStage.replace('_', ' ').toUpperCase()}
- Progress: ${completedTaskCount} of ${totalTaskCount} tasks completed
- Current Task: ${currentFocusTask ? `#${currentFocusTaskIndex + 1} - ${currentFocusTask.task}` : "All tasks completed"}

TASK EXECUTION RULES:
1. NEVER suggest or discuss future tasks until current task is completed
2. NEVER provide generic advice - execute the specific task at hand
3. NEVER ask for information already provided in the context
4. ALWAYS execute tasks in exact sequence
5. ALWAYS provide specific, actionable steps
6. ALWAYS include exact tools, websites, and resources to use
7. ALWAYS show your work and results in real-time
8. ALWAYS format responses in React-Markdown

EXECUTION APPROACH:
1. For the current task:
   - Execute immediately without asking for permission
   - If specific information is needed, ask ONLY for that
   - Complete as much as possible automatically
   - Show work and results in real-time
   - Only ask for user confirmation after showing results

2. For research tasks:
   - Perform the actual research
   - Present specific findings with data
   - Include exact examples and metrics
   - Make concrete recommendations
   - Show success metrics

3. For planning tasks:
   - Create complete, actionable plans
   - Include specific tools and resources
   - Provide exact steps with timelines
   - Calculate costs and ROI
   - Show success probability

4. For execution tasks:
   - Create the actual content or setup
   - Provide ready-to-use materials
   - Include all technical details
   - Show example outputs
   - Provide success criteria

CRITICAL INSTRUCTIONS:
1. DO NOT suggest or discuss future tasks
2. DO NOT provide generic advice
3. DO NOT ask "how would you like to proceed"
4. DO NOT ask for information already provided
5. DO NOT allow task jumping
6. DO execute the current task completely
7. DO show all work and calculations
8. DO provide specific metrics
9. DO maintain strict task order
10. DO reference tasks by number

When user asks about a task:
1. If it's the current task - execute it immediately
2. If it's a future task - remind them to complete current task first
3. If it's a past task - confirm it's completed before proceeding

When executing tasks:
1. DO NOT ask for permission to start
2. DO NOT provide generic steps
3. DO NOT suggest alternatives
4. DO execute the task completely
5. DO show all work and results`
    };

    // Truncate message history to fit within token limits
    const truncatedMessages = truncateMessageHistory(messages, 6000);
    
    // Prepare the messages array for the API
    const apiMessages = [
      systemContext,
      ...truncatedMessages.map((msg) => ({
        role: msg.is_user ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage.trim() }
    ];

    // Make the API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: apiMessages,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error in getAIChatResponse:", error);
    return "I apologize, but I encountered an error with my AI service. Please try again in a moment or contact support if the issue persists.";
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
  return generateTodos(projectId, budget, 'SMMA', typedSMMABlueprint);
};

export const generateCopywritingTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'Copywriting', typedCopywritingBlueprint);
};

export const generateSoftwareTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'Software', typedSoftwareBlueprint);
};

export const generateEcommerceTodos = async (
  projectId: string,
  budget: string
): Promise<any[] | null> => {
  return generateTodos(projectId, budget, 'Ecommerce', ecommerceBlueprint);
}; 