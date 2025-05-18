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
}

interface SMMAStage1 {
  objective: string;
  steps: SMMAStep[];
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
}

interface CopywritingStage1 {
  objective: string;
  steps: CopywritingStep[];
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
}

interface SoftwareStage1 {
  objective: string;
  steps: SoftwareStep[];
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
async function generateSMMATodosLegacy(projectId: string, budget: string) {
  // Get the first stage data from smmaBlueprint with proper typing
  const stage1Data = typedSMMABlueprint.stage_1;

  if (!stage1Data || !stage1Data.steps) {
    throw new Error("No steps found for stage 1 in SMMA blueprint");
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
  if (project?.outputs?.prequalification?.answers) {
    const answers = project.outputs.prequalification.answers;
    const questions = project.outputs.prequalification.questions || [];
    
    // Extract all prequalification info
    prequalificationInfo = "USER PREQUALIFICATION INFO:\n";
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      prequalificationInfo += `${questions[i]}: ${answers[i]}\n`;
    }
  }

  // Create a detailed prompt from the SMMA blueprint
  let steps: string[] = [];
  let criteria: string[] = [];
  let examples: string[] = [];
  
  // Extract data from steps
  stage1Data.steps.forEach(step => {
    if (step.title) steps.push(`${step.title}: ${step.criteria?.join(", ") || ""}`);
    if (step.criteria) criteria.push(...step.criteria);
    if (step.examples) examples.push(...step.examples);
    if (step.lowRiskAngles) examples.push(...step.lowRiskAngles);
  });

  const todoGenerationPrompt = `As an AI SMMA business mentor, generate 5 specific, actionable tasks for starting a social media marketing agency.

  Stage 1 Objective: ${stage1Data.objective}
  
  USER DETAILS:
  - Budget: ${budget}
  ${prequalificationInfo}
  
  STAGE DETAILS:
  Steps to Follow:
  ${steps.join('\n')}
  
  Niche Criteria:
  ${criteria.map(item => `- ${item}`).join('\n')}
  
  Offer Examples:
  ${examples.map(item => `- ${item}`).join('\n')}
  
  Generate exactly 5 ultra-specific, actionable tasks that will help the user achieve this stage's objective.
  Each task should include exact websites, tools, or platforms to use with specific steps.
  
  For example, instead of "Research your niche", write "Use LinkedIn Sales Navigator (linkedin.com/sales) to find 20 local businesses in the [niche] industry. Create a spreadsheet with their business name, social media handles, current ad spend (if visible), and pain points from their social posts."
  
  Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
  
  Example format:
  [
    {"task": "Sign up for Apollo.io (apollo.io) and use their Chrome extension to find 50 business owners in the [niche] industry. Create a spreadsheet with their name, business, email, and LinkedIn profile. Filter for businesses with 5-50 employees and active social media presence.", "completed": false},
    {"task": "Create a free Canva.com account and design 3 different ad mockups for [niche] businesses. Include a lead magnet offer, social proof section, and clear CTA. Save these as templates for future client pitches.", "completed": false}
  ]`;

  console.log("Generating initial SMMA todos");
  console.log("- Budget:", budget);
  console.log("- Prequalification info available:", !!prequalificationInfo);

  return await generateAndSaveTodos(projectId, budget, todoGenerationPrompt);
}

async function generateCopywritingTodosLegacy(projectId: string, budget: string) {
  // Get the first stage data from copywritingBlueprint with proper typing
  const stage1Data = typedCopywritingBlueprint.stage_1;

  if (!stage1Data || !stage1Data.steps) {
    throw new Error("No steps found for stage 1 in copywriting blueprint");
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
  if (project?.outputs?.prequalification?.answers) {
    const answers = project.outputs.prequalification.answers;
    const questions = project.outputs.prequalification.questions || [];
    
    // Extract all prequalification info
    prequalificationInfo = "USER PREQUALIFICATION INFO:\n";
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      prequalificationInfo += `${questions[i]}: ${answers[i]}\n`;
    }
  }

  // Create a detailed prompt from the copywriting blueprint
  let steps: string[] = [];
  let examples: string[] = [];
  let priorities: string[] = [];
  
  // Extract data from steps
  stage1Data.steps.forEach(step => {
    if (step.title) steps.push(`${step.title}: ${step.tip || ""}`);
    if (step.examples) examples.push(...step.examples);
    if (step.freeWorkPriorities) priorities.push(...step.freeWorkPriorities);
    if (step.process) steps.push(...step.process);
  });

  const todoGenerationPrompt = `As an AI copywriting business mentor, generate 5 specific, actionable tasks for starting a copywriting business.

  Stage 1 Objective: ${stage1Data.objective}
  
  USER DETAILS:
  - Budget: ${budget}
  ${prequalificationInfo}
  
  STAGE DETAILS:
  Steps to Follow:
  ${steps.join('\n')}
  
  Niche Examples:
  ${examples.map(item => `- ${item}`).join('\n')}
  
  Portfolio Priorities:
  ${priorities.map(item => `- ${item}`).join('\n')}
  
  Generate exactly 5 ultra-specific, actionable tasks that will help the user achieve this stage's objective.
  Each task should include exact websites, tools, or platforms to use with specific steps.
  
  For example, instead of "Create a portfolio", write "Sign up for Notion (notion.so) and create a portfolio page with 3 sections: (1) Before/After examples, (2) Testimonials, and (3) Services. Use their free templates to create a professional layout and add a contact form."
  
  Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
  
  Example format:
  [
    {"task": "Create a free account on Upwork (upwork.com) and complete your profile with a compelling bio that highlights your copywriting focus. Write 3 sample proposals for email sequence projects in your chosen niche, including your approach and pricing strategy.", "completed": false},
    {"task": "Sign up for Hunter.io (hunter.io) and use their free credits to find 20 business owners in your niche. Create a spreadsheet with their name, business, email, and website. Prepare a personalized outreach template offering a free email sequence rewrite.", "completed": false}
  ]`;

  console.log("Generating initial copywriting todos");
  console.log("- Budget:", budget);
  console.log("- Prequalification info available:", !!prequalificationInfo);

  return await generateAndSaveTodos(projectId, budget, todoGenerationPrompt);
}

async function generateSoftwareTodosLegacy(projectId: string, budget: string) {
  // Get the first stage data from softwareBlueprint with proper typing
  const stage1Data = typedSoftwareBlueprint.stage_1;

  if (!stage1Data || !stage1Data.steps) {
    throw new Error("No steps found for stage 1 in software blueprint");
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
  if (project?.outputs?.prequalification?.answers) {
    const answers = project.outputs.prequalification.answers;
    const questions = project.outputs.prequalification.questions || [];
    
    // Extract all prequalification info
    prequalificationInfo = "USER PREQUALIFICATION INFO:\n";
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      prequalificationInfo += `${questions[i]}: ${answers[i]}\n`;
    }
  }

  // Create a detailed prompt from the software blueprint
  let steps: string[] = [];
  let tools: string[] = [];
  let analysis: string[] = [];
  
  // Extract data from steps
  stage1Data.steps.forEach(step => {
    if (step.title) steps.push(`${step.title}: ${step.outcome || ""}`);
    if (step.tools) tools.push(...(Array.isArray(step.tools) ? step.tools : [step.tools]));
    if (step.analysis) analysis.push(...step.analysis);
    if (step.platforms) tools.push(...step.platforms);
    if (step.strategy) steps.push(step.strategy);
  });

  const todoGenerationPrompt = `As an AI software business mentor, generate 5 specific, actionable tasks for starting a SaaS business.

  Stage 1 Objective: ${stage1Data.objective}
  
  USER DETAILS:
  - Budget: ${budget}
  ${prequalificationInfo}
  
  STAGE DETAILS:
  Steps to Follow:
  ${steps.join('\n')}
  
  Tools to Use:
  ${tools.map(item => `- ${item}`).join('\n')}
  
  Analysis Points:
  ${analysis.map(item => `- ${item}`).join('\n')}
  
  Generate exactly 5 ultra-specific, actionable tasks that will help the user achieve this stage's objective.
  Each task should include exact websites, tools, or platforms to use with specific steps.
  
  For example, instead of "Research competitors", write "Create a free account on G2 (g2.com) and search for [your category] software. Create a spreadsheet comparing the top 5 competitors' features, pricing, and user reviews. Use their comparison tool to export the data."
  
  Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
  
  Example format:
  [
    {"task": "Sign up for Product Hunt (producthunt.com) and use their search to find 10 trending SaaS products in your target category. Create a spreadsheet analyzing their launch date, pricing, features, and user comments. Look for common pain points in the comments.", "completed": false},
    {"task": "Create a free account on BuiltWith (builtwith.com) and use their technology lookup to analyze 5 successful competitors. Document their tech stack, integrations, and marketing tools. Create a list of must-have features based on their common technologies.", "completed": false}
  ]`;

  console.log("Generating initial software todos");
  console.log("- Budget:", budget);
  console.log("- Prequalification info available:", !!prequalificationInfo);

  return await generateAndSaveTodos(projectId, budget, todoGenerationPrompt);
}

async function generateEcommerceTodosLegacy(projectId: string, budget: string) {
  // Get the first stage data from ecommerceBlueprint
  const stage1Data = ecommerceBlueprint.stage_1;

  if (!stage1Data || !stage1Data.steps) {
    throw new Error("No steps found for stage 1 in ecommerce blueprint");
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
    
    // Extract all prequalification info
    prequalificationInfo = "USER PREQUALIFICATION INFO:\n";
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      prequalificationInfo += `${questions[i]}: ${answers[i]}\n`;
      
      // Specifically extract launch date question/answer
      if (questions[i].includes("launch") || questions[i].includes("When do you wish")) {
        launchDateText = answers[i];
      }
    }
  }

  // Create a detailed prompt from the ecommerce blueprint
  let checklistItems: string[] = [];
  let deliverables: string[] = [];
  
  // Extract checklist items from all steps
  stage1Data.steps.forEach(step => {
    if (step.checklist) checklistItems.push(...step.checklist);
    if (step.validationChecklist) checklistItems.push(...step.validationChecklist);
    if (step.requirements) checklistItems.push(...step.requirements);
    if (step.rules) checklistItems.push(...step.rules);
  });
  
  if (stage1Data.deliverables) {
    deliverables = stage1Data.deliverables;
  }

  const todoGenerationPrompt = `As an AI ecommerce business mentor, I need your help with two things:
  1. Generate 5 specific, actionable tasks for starting an ecommerce business
  2. Interpret and formalize a launch date from the user's free-form text and today's date ${new Date().toISOString().split('T')[0]}

  BUDGET: ${budget}

  Stage 1 Objective: ${stage1Data.objective}
  
  Tasks should follow our ecommerce blueprint and focus on:
  
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
  - For the launch date, choose a reasonable date based on the user's text
  - If the launch timeframe is vague, use your judgment to select a date 60-90 days in the future
  - If no launch timeframe was provided, set a date 90 days from today i.e ${new Date().toISOString().split('T')[0]}
  - The launch date should be a valid ISO date string (YYYY-MM-DD)`;

  console.log("Generating initial ecommerce todos with launch date interpretation");
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
    console.error("OpenAI API Error in generateEcommerceTodos:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Parse the JSON response from OpenAI
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    console.log("Raw response:", data.choices[0].message.content);
    throw new Error("Failed to parse JSON response from API");
  }

  // Extract todos and launch date from the parsed response
  const todos = parsedResponse.tasks || [];
  const launchDate = parsedResponse.launchDate || null;
  const launchDateExplanation = parsedResponse.launchDateExplanation || "";
  
  console.log("Generated todos:", todos.length);
  console.log("Interpreted launch date:", launchDate);
  console.log("Launch date explanation:", launchDateExplanation);

  // Update project with generated todos and launch date
  try {
    const updateData: any = {
      todos: todos,
      tasks_in_progress: [],
      current_stage: "stage_1",
      total_budget: budget,
    };

    // Only add expected_launch_date if we received one from the API
    if (launchDate) {
      // Convert YYYY-MM-DD to full ISO string if needed
      const isoLaunchDate = launchDate.includes('T') 
        ? launchDate 
        : new Date(launchDate).toISOString();
      
      updateData.expected_launch_date = isoLaunchDate;
      
      // Store the explanation in the project outputs
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
    // Still return the todos even if the database update failed
  }

  return todos;
}

// Update references to use the legacy functions
export async function generateTodosForProject(
  projectId: string,
  businessType: string,
  budget: string
) {
  switch (businessType) {
    case "ecommerce":
      return await generateEcommerceTodosLegacy(projectId, budget);
    case "agency":
      return await generateSMMATodosLegacy(projectId, budget);
    case "copywriting":
      return await generateCopywritingTodosLegacy(projectId, budget);
    case "software":
      return await generateSoftwareTodosLegacy(projectId, budget);
    default:
      throw new Error(`Unsupported business type: ${businessType}`);
  }
}

// Keep the new exported functions
export const generateEcommerceTodos = async (
  stage: StageKey,
  project: Project
): Promise<any[] | null> => {
  try {
    // Get the appropriate strategy based on the stage
    const strategy = getStrategyForBusinessType('ecommerce');
    const stageData = strategy[stage];
    
    if (!stageData) {
      console.error('Invalid stage for ecommerce:', stage);
      return null;
    }

    // Generate todos based on stage data
    const todos = stageData.todos || [];
    return todos;
  } catch (error) {
    console.error('Error generating ecommerce todos:', error);
    return null;
  }
};

export const generateSoftwareTodos = async (
  stage: StageKey,
  project: Project
): Promise<any[] | null> => {
  try {
    // Get the appropriate strategy based on the stage
    const strategy = getStrategyForBusinessType('software');
    const stageData = strategy[stage];
    
    if (!stageData) {
      console.error('Invalid stage for software:', stage);
      return null;
    }

    // Generate todos based on stage data
    const todos = stageData.todos || [];
    return todos;
  } catch (error) {
    console.error('Error generating software todos:', error);
    return null;
  }
};

export const generateSMMATodos = async (
  stage: StageKey,
  project: Project
): Promise<any[] | null> => {
  try {
    // Get the appropriate strategy based on the stage
    const strategy = getStrategyForBusinessType('agency');
    const stageData = strategy[stage];
    
    if (!stageData) {
      console.error('Invalid stage for agency:', stage);
      return null;
    }

    // Generate todos based on stage data
    const todos = stageData.todos || [];
    return todos;
  } catch (error) {
    console.error('Error generating agency todos:', error);
    return null;
  }
};

export const generateCopywritingTodos = async (
  stage: StageKey,
  project: Project
): Promise<any[] | null> => {
  try {
    // Get the appropriate strategy based on the stage
    const strategy = getStrategyForBusinessType('copywriting');
    const stageData = strategy[stage];
    
    if (!stageData) {
      console.error('Invalid stage for copywriting:', stage);
      return null;
    }

    // Generate todos based on stage data
    const todos = stageData.todos || [];
    return todos;
  } catch (error) {
    console.error('Error generating copywriting todos:', error);
    return null;
  }
};

// Helper function to generate and save todos
async function generateAndSaveTodos(projectId: string, budget: string, todoGenerationPrompt: string) {
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
    console.error("OpenAI API Error in generateInitialTodos:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
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
  const formattedTodos = generatedTodos.map((todo: any) => ({
    task: todo.task,
    completed: false,
  }));

  try {
    // Get project to check for prequalification data
    const { data: project, error: getProjectError } = await supabase
      .from("projects")
      .select("outputs")
      .eq("id", projectId)
      .single();

    if (getProjectError) throw getProjectError;

    // Check for launch date in prequalification answers
    if (project?.outputs?.prequalification?.answers) {
      const answers = project.outputs.prequalification.answers;
      const launchDateQuestion = "When do you wish to launch your ecommerce business?";
      const questions = project.outputs.prequalification.questions || [];
      
      // Find the launch date question and answer
      const launchDateQuestionIndex = questions.findIndex((q: string) => q.includes("launch") || q.includes("When do you wish"));
      if (launchDateQuestionIndex !== -1 && answers[launchDateQuestionIndex]) {
        const launchDateText = answers[launchDateQuestionIndex];
        // Since we now use AI to interpret launch date, just log the text we found
        console.log("Found launch date answer:", launchDateText);
        // We'll process this in the AI-based todo generation
      }
    }

    // Update project with generated todos and launch date if available
    const updateData: any = {
      todos: formattedTodos,
      tasks_in_progress: [],
      current_stage: "stage_1",
      total_budget: budget,
    };

    const { error: projectUpdateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (projectUpdateError) {
      throw projectUpdateError;
    }
  } catch (error) {
    console.error("Error updating project with todos:", error);
    // Still return the todos even if we couldn't update the launch date
  }

  return formattedTodos;
}

// Helper function to generate a message announcing the launch date
export const generateLaunchDateMessage = async (launchDate: string, projectId?: string): Promise<string> => {
  if (!launchDate) return "";
  
  try {
    const date = new Date(launchDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    const today = new Date();
    const daysUntilLaunch = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilLaunch < 0) {
      return ""; // Date is in the past, don't show message
    }
    
    let timeframe;
    if (daysUntilLaunch <= 30) {
      timeframe = "very soon";
    } else if (daysUntilLaunch <= 90) {
      timeframe = "in a few months";
    } else if (daysUntilLaunch <= 180) {
      timeframe = "in about 6 months";
    } else {
      timeframe = "in the future";
    }
    
    // Get the explanation if available
    let explanationText = "";
    
    // Only try to get the explanation if projectId is provided
    if (projectId) {
      try {
        const { data: project } = await supabase
          .from("projects")
          .select("outputs")
          .eq("id", projectId)
          .single();
        
        if (project?.outputs?.launchDateInterpretation?.explanation) {
          explanationText = `\n\n**How I interpreted your launch timeframe**: ${project.outputs.launchDateInterpretation.explanation}`;
        }
      } catch (error) {
        console.error("Error fetching launch date explanation:", error);
      }
    }
    
    return `Based on your prequalification answers, I've set your expected launch date to **${formattedDate}** (${daysUntilLaunch} days from now). I'll help you prepare for launch ${timeframe}. We'll organize your todo items to achieve this target date.${explanationText}`;
  } catch (error) {
    console.error("Error formatting launch date:", error);
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

// Helper functions to extract checklist and AI support items from ecommerceBlueprint
function extractChecklistItems(stageData: any): string[] {
  if (!stageData || !stageData.steps) return [];
  
  const items: string[] = [];
  
  // Extract checklist items from each step
  stageData.steps.forEach((step: any) => {
    if (step.checklist) {
      items.push(...step.checklist);
    } else if (step.validationChecklist) {
      items.push(...step.validationChecklist);
    } else if (step.requirements) {
      items.push(...step.requirements);
    } else if (step.rules) {
      items.push(...step.rules);
    } else if (step.structure) {
      items.push(...step.structure);
    }
  });
  
  return items.length > 0 ? items : stageData.deliverables || [];
}

function extractAISupportItems(stageData: any): string[] {
  if (!stageData) return [];
  
  // Extract AI support items or use tips from steps
  const items: string[] = [];
  
  if (stageData.steps) {
    stageData.steps.forEach((step: any) => {
      if (step.title) {
        items.push(`Help with: ${step.title}`);
      }
    });
  }
  
  return items;
}

function extractScalingItems(scalingData: any): string[] {
  if (!scalingData || !scalingData.levers) return [];
  
  const items: string[] = [];
  
  // Extract scaling lever actions
  scalingData.levers.forEach((lever: any) => {
    if (lever.actions) {
      items.push(...lever.actions);
    }
  });
  
  return items.length > 0 ? items : scalingData.deliverables || [];
}

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
    if (!currentProject) {
      console.error("No current project provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your request because no project information was provided.";
    }

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages array provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process your previous messages correctly.";
    }

    if (!userMessage) {
      console.error("No user message provided to getAIChatResponse");
      return "I'm sorry, but I couldn't process an empty message.";
    }

    // Check if the user message is about a todo task or help request
    const isTaskRequest = userMessage.toLowerCase().includes("can you help") ||
      userMessage.toLowerCase().includes("how do i") || 
      userMessage.toLowerCase().includes("how to") ||
      userMessage.toLowerCase().includes("could you assist") || 
      userMessage.toLowerCase().includes("guide me") ||
      userMessage.toLowerCase().includes("help me complete this task") ||
      userMessage.toLowerCase().includes("help me");

    // Check if user has pasted a todo task from the list
    const isExactTodoTask = currentProject.todos?.some((todo: any) => 
      todo.task.toLowerCase() === userMessage.toLowerCase() ||
      userMessage.toLowerCase().includes(todo.task.toLowerCase())
    );

    // Get information about completed tasks and current stage
    const completedTaskCount = currentProject.todos?.filter((todo: any) => todo.completed).length || 0;
    const totalTaskCount = currentProject.todos?.length || 0;
    const currentStage = currentProject.current_stage || "stage_1";
    
    // Find the first incomplete task (the current focus task)
    const currentFocusTask = currentProject.todos?.find((todo: any) => !todo.completed);
    
    // Enhanced business context with action-oriented focus
    const businessTypeContext = `You are helping the user build a ${
      currentProject.business_type || "business"
    } business.
    The user's budget is ${currentProject.total_budget || "not set yet"}.
    The user's business idea is ${
      currentProject.business_idea || "not set yet"
    }.
    The user's income goal is ${currentProject.income_goal || "not set yet"}.

    These are are the user tasks for this stage: ${currentProject.todos?.map((t: any) => t.task).join(", ")}
    You have to follow the tasks in order and you have to complete the current task before moving to the next one. Please dont suggest other tasks except for the ones in the list.
    
    Current Progress:
    - Stage: ${currentStage.replace('_', ' ').toUpperCase()}
    - Completed Tasks: ${completedTaskCount} of ${totalTaskCount}
    - Next Task to Focus On: ${currentFocusTask ? `#${currentProject.todos.findIndex((t: any) => t.task === currentFocusTask.task) + 1} - ${currentFocusTask.task}` : "All tasks completed"}

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
    11. When suggesting ANY type of recommendations (personas, customer segments, product ideas, business names, marketing strategies, etc.), you MUST ALWAYS:
        a. Provide exactly 3-5 specific options/suggestions (never more, never less)
        b. For EACH option, calculate and display a simple success rate percentage (0-100%) based on:
           - Market saturation
           - Budget requirements
           - Market size
           - Unique selling proposition
           - Cash flow potential
        c. Format each suggestion as:
           ### Option 1: [Name/Title]
           [Brief description of the option]
           
           **Success Rate: XX%**
           
           This option has a XX% chance of success based on market analysis, budget requirements, market size, unique selling proposition, and cash flow potential.
        d. ALWAYS conclude by recommending the option with the highest success rate
        e. For product ideas specifically, emphasize the success rate prominently in your recommendation
    12. If a user proposes a new idea, evaluate it using the same success rate methodology and compare it with previous options.
    13. When a user selects or shows interest in a lower-scoring option (not the highest-scoring one):
        a. Express diplomatic concern about their choice
        b. Point out that the higher success rate option offers better chances of success
        c. ALWAYS include the success rate percentage
        d. Say something like: "I notice you're interested in [Option X] with a [Y]% success rate. Before proceeding, I'd like to highlight that [Highest Success Rate Option] has a [Z]% success rate, which is [Z-Y]% higher, indicating a stronger potential for success."
        e. For product ideas, explicitly state the difference in success rates
        f. Always ASK if they'd like to reconsider their choice
        g. If they insist on the lower-scoring option, respect their choice but periodically remind them of the challenges
    14. Always keep users focused on completing the current todo item before moving to the next one.
    15. Don't generate images, only provide text-based content.`;

    // Log details for debugging
    console.log("API Request details:");
    console.log("- Business type:", currentProject.business_type);
    console.log("- Message count:", messages.length);
    console.log("- System prompt length:", systemPrompt.length);
    console.log("- Is task request:", isTaskRequest);
    console.log("- Is exact todo task:", isExactTodoTask);
    console.log("- Current focus task:", currentFocusTask?.task || "None");
    
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
      model: "gpt-4",
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

    // Retry mechanism with exponential backoff
    const MAX_RETRIES = 5;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < MAX_RETRIES) {
      try {
        // If this is a retry, add a small delay with exponential backoff
        if (retryCount > 0) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 16000); // Capped at 16s
          console.log(`Retry ${retryCount}/${MAX_RETRIES} - Waiting ${delayMs}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

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
          const aiResponse = data.choices[0].message.content;
          return aiResponse;
        }

        // Handle non-200 responses
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          retry: retryCount + 1,
        });

        // If we hit a rate limit (429), retry with backoff
        if (response.status === 429) {
          console.log("Rate limit hit, will retry with backoff");
          retryCount++;
          lastError = new Error(`API Rate Limit Error: ${response.status}`);
          continue;
        }
        
        // If we hit a token limit error, try with fewer messages
        if (response.status === 400 && errorData?.error?.code === 'context_length_exceeded') {
          console.log("Context length exceeded. Trying with minimal context.");
          // Just keep the most recent 2-3 message pairs
          const minimalMessages = truncateMessageHistory(messages, 2000);
          
          // Update request body with minimal messages
          requestBody.messages = [
            {
              role: "system",
              content: `${systemPrompt}\n\n${businessTypeContext}`,
            },
            ...minimalMessages.map((msg) => ({
              role: msg.is_user ? "user" : "assistant",
              content: msg.content,
            })),
            { role: "user", content: userMessage },
          ];
          
          // Try once more with minimal context
          const retryResponse = await fetch(
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
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData.choices[0].message.content;
          } else {
            throw new Error(`API Retry Error: ${retryResponse.status} ${retryResponse.statusText}`);
          }
        }
        
        // For other errors, just throw and don't retry
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        lastError = error;
        
        // Only retry on network errors or 429 responses (which we handle above)
        if (!(error instanceof Error && error.message.includes("429"))) {
          break;
        }
        
        retryCount++;
      }
    }
    
    // If we've exhausted retries or had a non-retriable error
    if (lastError) {
      throw lastError;
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