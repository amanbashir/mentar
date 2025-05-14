import { supabase } from "../lib/supabaseClient";
import { saasStrategy } from "../../lib/mentars/saasStrategy";
import { agencyStrategy } from "../../lib/mentars/agencyStrategy";
import { ecomStrategy } from "../../lib/mentars/ecomStrategy";
import { copywritingStrategy } from "../../lib/mentars/copywritingStrategy";
import { ecommerceBlueprint } from "../../lib/mentars/ecom-new-strat";

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

    // For ecommerce, use the new blueprint structure
    if (businessType.toLowerCase() === "ecommerce") {
      return await generateEcommerceTodos(projectId, budget);
    }

    // For all other business types, use the original strategy
    const currentStrategy = getStrategyForBusinessType(businessType);
    const stage1Data = currentStrategy.stage_1;

    if (!stage1Data?.checklist) {
      throw new Error("No checklist found for stage 1");
    }

    const todoGenerationPrompt = `As an AI business mentor, generate detailed, 5 actionable tasks for building a ${businessType} business with a budget of ${budget}.
    The tasks should be based on the following checklist items:
    ${stage1Data.checklist.join("\n")}

    For each checklist item, create a maximum of 5 specific, actionable tasks in total for this stage.
    Make the tasks detailed and specific to their business type and budget.
    Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.

    MAX 5 TASKS
    DONT GENERATE MORE THAN 5 TASKS

    Example format:
    [
      {"task": "Research and analyze 3 direct competitors in the [specific niche] market", "completed": false},
      {"task": "Create a detailed spreadsheet comparing competitor pricing, features, and target audience", "completed": false}
    ]`;

    console.log("Generating initial todos for:", businessType);
    console.log("- Budget:", budget);
    console.log("- Checklist items:", stage1Data.checklist?.length || 0);

    return await generateAndSaveTodos(projectId, budget, todoGenerationPrompt);
  } catch (error) {
    console.error("Error generating todos:", error);
    throw error;
  }
};

// Helper function to generate ecommerce todos based on the new blueprint
async function generateEcommerceTodos(projectId: string, budget: string) {
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

// Generate stage introduction
export const generateStageIntroduction = (
  businessType: string,
  stage: StageKey,
  strategy: BusinessStrategy,
  budget: string
): string => {
  const stageData = strategy[stage];
  const stageNumber = stage.replace("stage_", "");
  
  // For ecommerce, use the richer information from ecommerceBlueprint
  if (businessType.toLowerCase() === "ecommerce") {
    // Check if the stage exists in ecommerceBlueprint
    const blueprintKey = stage as keyof typeof ecommerceBlueprint;
    if (!ecommerceBlueprint[blueprintKey] || blueprintKey === 'preQualification') {
      return getDefaultStageIntroduction(stageNumber, businessType, stageData, budget);
    }
    
    const ecomStage = ecommerceBlueprint[blueprintKey];
    
    let stepsContent = "";
    if ('steps' in ecomStage && Array.isArray(ecomStage.steps)) {
      stepsContent = ecomStage.steps.map((step: any) => {
        let stepContent = `### ${step.title}\n`;
        
        if (step.goal) stepContent += `**Goal:** ${step.goal}\n\n`;
        
        if (step.checklist && Array.isArray(step.checklist)) {
          stepContent += "**Checklist:**\n" + step.checklist.map((item: string) => `• ${item}`).join("\n") + "\n\n";
        } else if (step.requirements && Array.isArray(step.requirements)) {
          stepContent += "**Requirements:**\n" + step.requirements.map((item: string) => `• ${item}`).join("\n") + "\n\n";
        } else if (step.validationChecklist && Array.isArray(step.validationChecklist)) {
          stepContent += "**Validation Checklist:**\n" + step.validationChecklist.map((item: string) => `• ${item}`).join("\n") + "\n\n";
        }
        
        return stepContent;
      }).join("");
    }
    
    let deliverables = "";
    if ('deliverables' in ecomStage && Array.isArray(ecomStage.deliverables)) {
      deliverables = "**Deliverables:**\n" + ecomStage.deliverables.map((item: string) => `• ${item}`).join("\n");
    }
    
    let pitfalls = "";
    if ('pitfalls' in ecomStage && Array.isArray(ecomStage.pitfalls)) {
      pitfalls = "**Pitfalls to Avoid:**\n" + ecomStage.pitfalls.map((item: string) => `• ${item}`).join("\n");
    }
    
    return `
Great! I've set your budget to ${budget}. Let me introduce you to Stage ${stageNumber} of building your ecommerce business.


We are at now Stage ${stageNumber} of building your ecommerce business.
Our objective here is to: ${ecomStage.objective}

Next Steps:
1. Review the tasks I've generated for you in the sidebar
2. Start with the first task and let me know when you complete it
3. I'll guide you through each step and help you make progress

Would you like to start with the first task? I'm here to help you every step of the way! 

Simple click on "Get Started" on a particular task and I'll guide you through it.`;

  }
  
  // For other business types, use the original format
  return getDefaultStageIntroduction(stageNumber, businessType, stageData, budget);
};

// Helper function for the default stage introduction format
function getDefaultStageIntroduction(
  stageNumber: string,
  businessType: string,
  stageData: StageData,
  budget: string
): string {
  return `
Great! I've set your budget to ${budget}. Let me introduce you to Stage ${stageNumber} of building your ${businessType} business.

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
}

// Get the appropriate strategy based on business type
export const getStrategyForBusinessType = (businessType: string): BusinessStrategy => {
  switch (businessType.toLowerCase()) {
    case "saas":
      return saasStrategy as BusinessStrategy;
    case "agency":
      return agencyStrategy as BusinessStrategy;
    case "ecommerce": {
      // Convert ecommerceBlueprint to match BusinessStrategy interface
      const adaptedStrategy: BusinessStrategy = {
        stage_1: {
          objective: ecommerceBlueprint.stage_1.objective,
          checklist: extractChecklistItems(ecommerceBlueprint.stage_1),
          aiSupport: extractAISupportItems(ecommerceBlueprint.stage_1)
        },
        stage_2: {
          objective: ecommerceBlueprint.stage_2.objective,
          checklist: extractChecklistItems(ecommerceBlueprint.stage_2),
          aiSupport: extractAISupportItems(ecommerceBlueprint.stage_2)
        },
        stage_3: {
          objective: ecommerceBlueprint.stage_3.objective,
          checklist: extractChecklistItems(ecommerceBlueprint.stage_3),
          aiSupport: extractAISupportItems(ecommerceBlueprint.stage_3)
        },
        stage_4: {
          objective: ecommerceBlueprint.stage_4.objective,
          checklist: extractChecklistItems(ecommerceBlueprint.stage_4),
          aiSupport: extractAISupportItems(ecommerceBlueprint.stage_4)
        },
        stage_5: {
          objective: ecommerceBlueprint.stage_5.objective,
          checklist: extractChecklistItems(ecommerceBlueprint.stage_5),
          aiSupport: extractAISupportItems(ecommerceBlueprint.stage_5)
        },
        scaling: {
          objective: ecommerceBlueprint.scaling.objective,
          checklist: extractScalingItems(ecommerceBlueprint.scaling),
          aiSupport: ecommerceBlueprint.scaling.levers?.map(lever => lever.title) || []
        }
      };
      return adaptedStrategy;
    }
    case "copywriting":
      return copywritingStrategy as BusinessStrategy;
    default:
      return saasStrategy as BusinessStrategy; // Default to SaaS strategy
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
    For example, instead of "Get a domain name", say "Go to Namecheap.com or GoDaddy.com and purchase a domain name that includes your main keyword. Budget $10-15 for the first year."
    Instead of "Set up social media", say "Create a business account on Instagram by downloading the app from App Store/Google Play, clicking 'Sign Up', selecting 'Create a Business Account', and completing your profile with your logo and a 150-character bio."

    Format the response as a JSON array of tasks, where each task has a 'task' and 'completed' field.

    MAX 5 TASKS
    DONT GENERATE MORE THAN 5 TASKS


    Example format:
    [
      {"task": "Go to Ahrefs.com or SEMrush.com (both offer free trials) and research 3 direct competitors in your niche. Create a spreadsheet listing their top 10 ranking keywords, backlink sources, and content topics.", "completed": false},
      {"task": "Sign up for a free Canva.com account, select the 'Logo' template, and design 3 different logo options using your brand colors. Export them as PNG files with transparent backgrounds.", "completed": false}
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
  
  For example, instead of "Set up your store", write "Sign up for Shopify (shopify.com) using the $1/month starter plan. Choose the 'Dawn' theme, upload your logo, and set your primary color to match. Configure the navigation menu with Home, Products, and Contact pages."
  
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

    // Enhanced business context with action-oriented focus
    const businessTypeContext = `You are helping the user build a ${
      currentProject.business_type || "business"
    } business.
    The user's budget is ${currentProject.total_budget || "not set yet"}.
    The user's business idea is ${
      currentProject.business_idea || "not set yet"
    }.
    The user's income goal is ${currentProject.income_goal || "not set yet"}.

    

    IMPORTANT INSTRUCTIONS:
    1. DO NOT ask questions about business type, budget, business idea, or income goals - this information is already provided above.
    2. DO NOT ask for context about the business - use the information provided above.
    3. Only ask specific questions related to the immediate task or problem the user needs help with.
    4. Focus on providing direct, actionable solutions based on the context you already have.
    5. ALWAYS format your responses using React-Markdown format so they render properly in the interface.

    ${isExactTodoTask || isTaskRequest ?
      `IMPORTANT: The user is asking for help with a specific task or has pasted a todo item from their list.
      You MUST directly solve their task, not just provide guidance on how to do it.
      DO NOT say phrases like "Here's how to do this" or "Step-by-step way to do this".
      Instead, DIRECTLY give them the solution, exact content, templates, or completed work they need.
      For example:
      - If they need marketing copy, WRITE the actual marketing copy
      - If they need a business plan, CREATE the actual business plan
      - If they need a competitor analysis, PROVIDE the complete analysis
      - If they need a pricing strategy, DEVELOP the full pricing model

      Provide the FINISHED WORK they need, not just instructions on how to do it themselves.
      Include specific information, examples, and completed templates that they can use immediately.
      
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