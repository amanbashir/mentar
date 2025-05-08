import { supabase } from "../lib/supabaseClient";
import { saasStrategy } from "../../lib/mentars/saasStrategy";
import { agencyStrategy } from "../../lib/mentars/agencyStrategy";
import { ecomStrategy } from "../../lib/mentars/ecomStrategy";
import { copywritingStrategy } from "../../lib/mentars/copywritingStrategy";

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

interface StageData {
  objective: string;
  checklist?: string[];
  aiSupport?: string[];
  outreachTypes?: string[];
  outreachChecklist?: string[];
  resources?: {
    tools: string[];
    templates: string[];
  };
  metrics?: string[];
  scaling?: string[];
}

interface BusinessStrategy {
  stage_1: StageData;
  stage_2: StageData;
  stage_3: StageData;
  stage_4: StageData;
  stage_5: StageData;
  scaling: StageData;
}

type StageKey = keyof BusinessStrategy;

// A typed empty strategy to use for progress calculations
export const typedSaasStrategy: BusinessStrategy = saasStrategy as BusinessStrategy;

// Generate todos based on business type and budget
export const generateInitialTodos = async (
  projectId: string,
  budget: string,
  businessType: string
) => {
  try {
    // Check API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing in generateInitialTodos");
      throw new Error("API configuration is missing");
    }

    const currentStrategy = getStrategyForBusinessType(businessType);
    const stage1Data = currentStrategy.stage_1;

    if (!stage1Data?.checklist) {
      throw new Error("No checklist found for stage 1");
    }

    const todoGenerationPrompt = `As an AI business mentor, generate detailed, actionable tasks for building a ${businessType} business with a budget of ${budget}. 
    The tasks should be based on the following checklist items:
    ${stage1Data.checklist.join("\n")}
    
    For each checklist item, create 4-5 specific, actionable tasks that the user must complete.
    Make the tasks detailed and specific to their business type and budget.
    Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
    Example format:
    [
      {"task": "Research and analyze 3 direct competitors in the [specific niche] market", "completed": false},
      {"task": "Create a detailed spreadsheet comparing competitor pricing, features, and target audience", "completed": false}
    ]`;

    console.log("Generating initial todos for:", businessType);
    console.log("- Budget:", budget);
    console.log("- Checklist items:", stage1Data.checklist?.length || 0);

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

    // Update project with generated todos
    const { error: projectUpdateError } = await supabase
      .from("projects")
      .update({
        todos: formattedTodos,
        tasks_in_progress: [],
        current_stage: "stage_1",
        total_budget: budget,
      })
      .eq("id", projectId);

    if (projectUpdateError) {
      throw projectUpdateError;
    }

    return formattedTodos;
  } catch (error) {
    console.error("Error generating todos:", error);
    throw error;
  }
};

// Generate stage introduction
export const generateStageIntroduction = (
  businessType: string,
  stage: StageKey,
  strategy: BusinessStrategy,
  budget: string
): string => {
  const stageData = strategy[stage];
  const stageNumber = stage.replace("stage_", "");

  return `Great! I've set your budget to ${budget}. Let me introduce you to Stage ${stageNumber} of building your ${businessType} business.

Stage ${stageNumber} Objective: ${stageData.objective}

Your Action Plan:
${stageData.checklist?.map((item) => `• ${item}`).join("\n")}

Next Steps:
1. Review the tasks I've generated for you in the sidebar
2. Start with the first task and let me know when you complete it
3. I'll guide you through each step and help you make progress

Pro Tips:
${stageData.aiSupport?.map((tip) => `• ${tip}`).join("\n")}

Would you like to start with the first task? I'm here to help you every step of the way!`;
};

// Get the appropriate strategy based on business type
export const getStrategyForBusinessType = (businessType: string): BusinessStrategy => {
  switch (businessType.toLowerCase()) {
    case "saas":
      return saasStrategy as BusinessStrategy;
    case "agency":
      return agencyStrategy as BusinessStrategy;
    case "ecommerce":
      return ecomStrategy as BusinessStrategy;
    case "copywriting":
      return copywritingStrategy as BusinessStrategy;
    default:
      return saasStrategy as BusinessStrategy; // Default to SaaS strategy
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
    
    Generate 5-7 ultra-specific, actionable tasks that the user must complete for this stage.
    Each task should include exact websites, tools, or platforms to use, with specific steps.
    For example, instead of "Get a domain name", say "Go to Namecheap.com or GoDaddy.com and purchase a domain name that includes your main keyword. Budget $10-15 for the first year."
    Instead of "Set up social media", say "Create a business account on Instagram by downloading the app from App Store/Google Play, clicking 'Sign Up', selecting 'Create a Business Account', and completing your profile with your logo and a 150-character bio."
    
    Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.
    Example format:
    [
      {"task": "Go to Ahrefs.com or SEMrush.com (both offer free trials) and research 3 direct competitors in your niche. Create a spreadsheet listing their top 10 ranking keywords, backlink sources, and content topics.", "completed": false},
      {"task": "Sign up for a free Canva.com account, select the 'Logo' template, and design 3 different logo options using your brand colors. Export them as PNG files with transparent backgrounds.", "completed": false}
    ]`;

    console.log(`Generating tasks for stage ${stage} of ${currentProject.business_type} business`);

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
        businessType: currentProject.business_type
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
      .eq("id", currentProject.id);

    if (error) {
      console.error("Error updating todos for stage:", error);
      return null;
    }

    return newTodos;
  } catch (error) {
    console.error("Error updating todos for stage:", error);
    return null;
  }
};

// Generate business overview summary
export const generateBusinessOverviewSummary = async (currentProject: any) => {
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

    const summaryPrompt = `Create a concise business overview summary for a ${
      currentProject.business_type || "new"
    } business with the following details:
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
    
    Focus on the key aspects: business type, main offering, target market, and current progress.`;

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

    const businessTypeContext = `You are helping the user build a ${
      currentProject.business_type || "business"
    } business. 
    The user's budget is ${currentProject.total_budget || "not set yet"}. 
    The user's business idea is ${
      currentProject.business_idea || "not set yet"
    }.
    The user's income goal is ${currentProject.income_goal || "not set yet"}.

    When providing a business overview or summary, keep it concise and to the point (max 150 characters). Focus on the key aspects: business type, main offering, target market, and unique value proposition.`;

    // Log details for debugging
    console.log("API Request details:");
    console.log("- Business type:", currentProject.business_type);
    console.log("- Message count:", messages.length);
    console.log("- System prompt length:", systemPrompt.length);
    
    // Check API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return "I apologize, but I can't process your request because the API configuration is missing. Please contact support.";
    }
    
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
              content: `${systemPrompt}\n\n${businessTypeContext}`,
            },
            ...messages.map((msg) => ({
              role: msg.is_user ? "user" : "assistant",
              content: msg.content,
            })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          presence_penalty: 0.6,
          frequency_penalty: 0.6,
        }),
      }
    );

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
    console.error("Error getting AI response:", error);
    return "I apologize, but I encountered an error with my AI service. Please try again or contact support if the issue persists.";
  }
};

// Get next stage
export const getNextStage = (currentStage: StageKey): StageKey | null => {
  const stages: StageKey[] = [
    "stage_1",
    "stage_2",
    "stage_3",
    "stage_4",
    "stage_5",
    "scaling",
  ];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
}; 