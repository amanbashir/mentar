import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Components } from "react-markdown";
import { supabase } from "../../lib/supabaseClient";
import { systemPrompt, getCombinedPrompt } from "../../utils/prompts";
import "./AIChatInterface.css";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import { FaTrashCan } from "react-icons/fa6";
import { ecommerceBlueprint } from "../../../lib/mentars/ecom-new-strat";
import {
  extractBudget,
  extractIncomeGoal,
  getStrategyForBusinessType,
  generateBusinessOverviewSummary,
  getAIChatResponse,
  getNextStage,
  typedSaasStrategy,
  generateLaunchDateMessage,
  generateEcommerceTodos,
  generateSoftwareTodos,
  generateSMMATodos,
  generateCopywritingTodos,
  generateTodosForProject,
  findTodoTaskByText,
  getNextIncompleteTodo,
  isTaskCompletionMessage,
  isNextTaskRequest,
  generateDetailedTaskCompletionMessage,
  generateEcommerceProductRecommendations,
  formatProductRecommendations,
} from "../../utils/openai";
import DeleteProjectDialog from "../../components/DeleteProjectDialog";

// Helper function to check for image/logo generation requests
const isImageGenerationRequest = (message: string): boolean => {
  const lowercaseMsg = message.toLowerCase();
  return (
    lowercaseMsg.includes("generate image") ||
    lowercaseMsg.includes("create image") ||
    lowercaseMsg.includes("make image") ||
    lowercaseMsg.includes("design logo") ||
    lowercaseMsg.includes("create logo") ||
    lowercaseMsg.includes("generate logo") ||
    lowercaseMsg.includes("make logo") ||
    lowercaseMsg.includes("draw") ||
    (lowercaseMsg.includes("logo") && lowercaseMsg.includes("design"))
  );
};

// Types
type StageKey =
  | "preStartFitCheck"
  | "preStartEvaluation"
  | "preQualification"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "stage_5"
  | "stage_6"
  | "stage_7"
  | "stage_8"
  | "stage_9"
  | "stage_10"
  | "scaling";

interface Project {
  id: string;
  user_id: string;
  business_type: string;
  created_at: string;
  is_deleted: boolean;
  selected_model: string | null;
  income_goal: string;
  total_budget: string | null;
  business_idea: string | null;
  business_overview_summary: string | null;
  current_stage: StageKey | null;
  current_step: string | null;
  expected_launch_date: string | null;
  todos: any[];
  tasks_in_progress: string[];
  completed_stages: StageKey[];
  notes: Record<string, any>;
  outputs?: {
    prequalification?: {
      questions: string[];
      answers: string[];
      completedAt: string;
      completed?: boolean;
      rawLaunchDate?: string | null; // Update to allow null
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  stage: StageKey;
  step: string | null;
}

interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

interface PopupMessage {
  id: string;
  content: string;
  isUser: boolean;
}

interface StageData {
  objective: string;
  steps?: Array<{
    title: string;
    [key: string]: any;
  }>;
  checklist?: string[];
  aiSupport?: string[];
  deliverables?: string[];
  pitfalls?: string[];
  [key: string]: any;
}

interface BusinessStrategy {
  preStartFitCheck?: {
    description: string;
    questions: string[];
    guidance?: string;
  };
  preStartEvaluation?: {
    description: string;
    questions: string[];
    actions?: string[];
  };
  preQualification?: {
    description: string;
    questions: string[];
    actions?: string[];
  };
  stage_1: StageData;
  stage_2: StageData;
  stage_3: StageData;
  stage_4: StageData;
  stage_5: StageData;
  scaling?: StageData;
  [key: string]: any;
}

// Interface for prequalification state
interface PrequalificationState {
  isPrequalifying: boolean;
  currentQuestionIndex: number;
  answers: string[];
  completed: boolean;
}

// Add new Toast interface
interface Toast {
  id: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

// Custom components for markdown
const CodeBlock = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const language = className ? className.replace(/language-/, "") : "";
  return (
    <div className="markdown-code-block">
      <div className="code-header">
        {language && <span className="code-language">{language}</span>}
        <button
          className="copy-button"
          onClick={() => {
            const code = children?.toString() || "";
            navigator.clipboard.writeText(code);
          }}
        >
          Copy
        </button>
      </div>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  );
};

const MarkdownLink = ({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="markdown-link"
    >
      {children}
    </a>
  );
};

// Helper functions
const calculateProgress = (
  completedStages: string[],
  tasksInProgress: string[]
): number => {
  const totalStages = Object.keys(typedSaasStrategy).length;
  const completedStageCount = completedStages.length;
  const stageProgress = (completedStageCount / totalStages) * 100;

  const totalTasks = Object.values(typedSaasStrategy).reduce(
    (acc, stage: any) => {
      return acc + (stage.checklist?.length || 0);
    },
    0
  );
  const completedTaskCount = tasksInProgress.length;
  const taskProgress = (completedTaskCount / totalTasks) * 100;

  return Math.round((stageProgress + taskProgress) / 2);
};

// Add helper function to parse launch date
const parseLaunchDate = (dateInput: string): string | null => {
  if (!dateInput) return null;

  // Try to parse relative dates like "2 months", "3 weeks", etc.
  const relativeDateMatch = dateInput.match(/(\d+)\s+(month|week|day)s?/i);
  if (relativeDateMatch) {
    const [_, amount, unit] = relativeDateMatch;
    const date = new Date();
    switch (unit.toLowerCase()) {
      case "month":
        date.setMonth(date.getMonth() + parseInt(amount));
        break;
      case "week":
        date.setDate(date.getDate() + parseInt(amount) * 7);
        break;
      case "day":
        date.setDate(date.getDate() + parseInt(amount));
        break;
    }
    return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
  }

  // Try to parse specific dates
  try {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
    }
  } catch (e) {
    console.error("Error parsing date:", e);
  }

  return null;
};

function AIChatInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [tempBudget, setTempBudget] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessage, setInitialMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const popupMessagesEndRef = useRef<HTMLDivElement>(null);
  const [popupMessages, setPopupMessages] = useState<PopupMessage[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isEditingLaunchDate, setIsEditingLaunchDate] = useState(false);
  const [tempLaunchDate, setTempLaunchDate] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [expandedTodos, setExpandedTodos] = useState<Record<string, boolean>>(
    {}
  );
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const popupInputRef = useRef<HTMLTextAreaElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"gpt-3.5-turbo" | "gpt-4">(
    "gpt-4"
  );

  // Add prequalification state
  const [prequalification, setPrequalification] =
    useState<PrequalificationState>({
      isPrequalifying: false,
      currentQuestionIndex: 0,
      answers: [],
      completed: false,
    });

  const messagesContainerStyle = {
    gap: "28px",
  };

  const inputContainerStyle = {
    padding: "12px 24px",
  };

  const todoItemStyle = {
    padding: "16px",
  };

  useEffect(() => {
    // Handle new project from onboarding
    const newProject = location.state?.project;
    if (newProject) {
      setCurrentProject(newProject);
      fetchUserProjects();

      // Show intro message first
      const introMessage = getBusinessIntroMessage(newProject.business_type);
      saveMessage(introMessage, false);

      // Start prequalification if it's an ecommerce project
      if (newProject.business_type === "ecommerce") {
        startPrequalification();
      } else {
        fetchProjectMessages(newProject.id);
      }

      // Clear the location state to prevent re-setting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    // Load messages when cuxrent project changes
    if (currentProject) {
      fetchProjectMessages(currentProject.id);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    // Handle clicking outside of dropdown to close it
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.log("No session found, redirecting to login");
          navigate("/login");
          return;
        }

        console.log("Session found:", session.user.id);
        setIsAuthChecked(true);

        fetchUserProjects();
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate("/login");
      }
    };

    checkAuth();
  }, []);

  const fetchUserProjects = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("No session found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("Fetching projects for user:", session.user.id);
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      console.log("Projects fetched:", projects);
      if (projects && Array.isArray(projects) && projects.length > 0) {
        console.log("Found", projects.length, "projects");
        setProjects(projects);

        // Only set current project if none is selected or current one not found
        if (
          !currentProject ||
          !projects.find((p) => p.id === currentProject.id)
        ) {
          console.log("Setting current project to:", projects[0]);
          setCurrentProject(projects[0]);
        }
      } else {
        console.log("No projects found");
        setProjects([]);
        setCurrentProject(null);

        // Only redirect if not already on onboarding
        if (location.pathname !== "/onboarding") {
          console.log("Redirecting to onboarding");
          navigate("/onboarding", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error in fetchUserProjects:", error);
      setProjects([]);
      setCurrentProject(null);
    }
  };

  const fetchProjectMessages = async (projectId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Set initial message based on whether budget is set
      if (!currentProject?.total_budget) {
        setInitialMessage(``);
      } else if (!currentProject?.income_goal) {
        setInitialMessage(
          `Please specify your target monthly income goal to help me tailor the business plan.`
        );
      } else {
        setInitialMessage(
          `Welcome back! I'm ready to help you with your ${currentProject.business_type} business. What would you like to work on?`
        );
      }

      if (messages) {
        setMessages(messages);

        // Check if we need to start prequalification for any business type
        const strategy = getStrategyForBusinessType(
          currentProject?.business_type || ""
        );
        if (
          strategy.preQualification?.questions &&
          messages.length === 0 &&
          (!currentProject?.outputs?.prequalification ||
            !currentProject?.outputs?.prequalification.completed)
        ) {
          startPrequalification();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const saveMessage = async (content: string, isUser: boolean) => {
    if (!currentProject) return;

    try {
      const { data: message, error } = await supabase
        .from("messages")
        .insert([
          {
            project_id: currentProject.id,
            content,
            is_user: isUser,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (message) {
        setMessages((prev) => [...prev, message]);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleProjectSwitch = (project: Project) => {
    console.log("Switching to project:", project);
    setCurrentProject(project);
    // Set the model based on project's selected_model if available
    if (project.selected_model) {
      setSelectedModel(project.selected_model as "gpt-3.5-turbo" | "gpt-4");
    }
    setShowDropdown(false);
  };

  const handleNewProject = () => {
    setShowDropdown(false);
    // Use replace to prevent back navigation issues
    navigate("/onboarding", { replace: true });
  };

  const handleSettings = () => {
    // Implement settings handling
    navigate("/settings");
    console.log("Settings option clicked");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent project switching when clicking delete
    const projectToDelete = projects.find((p) => p.id === projectId);
    if (projectToDelete) {
      setProjectToDelete(projectToDelete);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      // Get the current user to verify ownership
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // First, delete all messages for this project
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("project_id", projectToDelete.id);

      if (messagesError) {
        throw messagesError;
      }

      // Then, delete the project
      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id);

      if (projectError) {
        throw projectError;
      }

      // Update local state
      const updatedProjects = projects.filter(
        (p) => p.id !== projectToDelete.id
      );
      setProjects(updatedProjects);

      // If the deleted project was the current one, switch to the most recent project
      if (currentProject?.id === projectToDelete.id) {
        if (updatedProjects.length > 0) {
          setCurrentProject(updatedProjects[0]);
          setMessages([]);
        } else {
          setCurrentProject(null);
          setMessages([]);
          // Redirect to onboarding if all projects are deleted
          navigate("/onboarding", { replace: true });
        }
      }

      // Close the dialog
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error("Error deleting project:", error);
      alert(`Failed to delete project: ${error.message}`);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height of 200px
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleChatPopup = () => {
    setIsChatPopupOpen(!isChatPopupOpen);
    if (isChatPopupOpen) {
      setPopupMessages([]);
      setPopupMessage("");
    }
  };

  const scrollToBottom = () => {
    popupMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add common intro messages for each business type
  const getBusinessIntroMessage = (businessType: string): string => {
    switch (businessType.toLowerCase()) {
      case "ecommerce":
        return `Welcome to your ecommerce journey! I'll help you build a successful online store from scratch. We'll focus on finding the right product, setting up your store, and scaling your business through effective marketing. Let's start by understanding your goals and resources.`;
      case "agency":
        return `Welcome to your Social Media Marketing Agency (SMMA) journey! I'll guide you through building a results-driven agency that helps businesses grow through social media marketing. We'll focus on client acquisition, service delivery, and scaling your operations. Let's begin by assessing your fit for this business model.`;
      case "software":
        return `Welcome to your SaaS business journey! I'll help you build a scalable software product that solves real problems and generates recurring revenue. We'll focus on idea validation, MVP development, and growth strategies. Let's start by evaluating your readiness for this venture.`;
      case "copywriting":
        return `Welcome to your copywriting business journey! I'll help you build a successful copywriting service that delivers high-converting content for businesses. We'll focus on building your portfolio, finding clients, and delivering results. Let's begin by assessing your fit for this business model.`;
      default:
        return `Welcome to your business journey! I'll help you build and grow your business step by step. Let's start by understanding your goals and resources.`;
    }
  };

  // Update the startPrequalification function
  const startPrequalification = () => {
    if (!currentProject) return;

    // Get the appropriate blueprint based on business type
    const strategy = getStrategyForBusinessType(currentProject.business_type);
    if (!strategy.preQualification?.questions) {
      console.error(
        `No prequalification questions found for ${currentProject.business_type}`
      );
      return;
    }

    setPrequalification({
      isPrequalifying: true,
      currentQuestionIndex: 0,
      answers: [],
      completed: false,
    });

    // Send first question without examples
    const firstQuestion = strategy.preQualification.questions[0];
    saveMessage(firstQuestion, false);
  };

  // Update handleNextPrequalificationQuestion to store raw launch date
  const handleNextPrequalificationQuestion = async (userAnswer: string) => {
    if (!currentProject || !prequalification.isPrequalifying) return;

    // Get the appropriate blueprint based on business type
    const strategy = getStrategyForBusinessType(currentProject.business_type);
    if (!strategy.preQualification?.questions) {
      console.error(
        `No prequalification questions found for ${currentProject.business_type}`
      );
      return;
    }

    // Save user's answer
    const newAnswers = [...prequalification.answers, userAnswer];
    const nextQuestionIndex = prequalification.currentQuestionIndex + 1;

    // Check if we've reached the end of questions
    if (nextQuestionIndex >= strategy.preQualification.questions.length) {
      // All questions answered, complete prequalification
      setPrequalification({
        isPrequalifying: false,
        currentQuestionIndex: nextQuestionIndex,
        answers: newAnswers,
        completed: true,
      });

      // Find launch date answer
      const launchDateQuestionIndex =
        strategy.preQualification.questions.findIndex(
          (q: string) => q.includes("launch") || q.includes("When do you wish")
        );
      const rawLaunchDate =
        launchDateQuestionIndex !== -1
          ? newAnswers[launchDateQuestionIndex]
          : null;

      // Save prequalification answers to project metadata
      const prequalificationData = {
        questions: strategy.preQualification.questions,
        answers: newAnswers,
        completedAt: new Date().toISOString(),
        rawLaunchDate: rawLaunchDate, // Store the raw launch date in the outputs
      };

      // Create outputs object if it doesn't exist
      const updatedOutputs = {
        ...(currentProject.outputs || {}),
        prequalification: prequalificationData,
      };

      // Update project with prequalification data
      const { error } = await supabase
        .from("projects")
        .update({ outputs: updatedOutputs })
        .eq("id", currentProject.id);

      if (error) {
        console.error("Error saving prequalification data:", error);
      } else {
        // Update local state with new outputs
        setCurrentProject((prev) =>
          prev ? { ...prev, outputs: updatedOutputs } : null
        );
      }

      // Continue with normal flow - ask for budget if not set
      if (!currentProject.total_budget) {
        const budgetQuestion =
          "Great! Thanks for sharing that information. Now, let's set your budget to get started. Please enter your planned investment amount.";
        await saveMessage(budgetQuestion, false);
      } else if (!currentProject.income_goal) {
        const incomeQuestion =
          "Thanks for the information! Please specify your target monthly income goal to help me tailor the business plan.";
        await saveMessage(incomeQuestion, false);
      } else {
        // Both budget and income already set, send summary message
        const summary = generatePrequalificationSummary(
          newAnswers,
          strategy.preQualification.questions
        );
        await saveMessage(summary, false);
      }
    } else {
      // Send next question without examples
      const nextQuestion =
        strategy.preQualification.questions[nextQuestionIndex];
      await saveMessage(nextQuestion, false);

      // Update prequalification state
      setPrequalification({
        isPrequalifying: true,
        currentQuestionIndex: nextQuestionIndex,
        answers: newAnswers,
        completed: false,
      });
    }
  };

  // Generate a summary based on prequalification answers
  const generatePrequalificationSummary = (
    answers: string[],
    questions: string[]
  ): string => {
    // Evaluate the prequalification answers
    const evaluation = evaluatePrequalificationAnswers(
      answers,
      currentProject?.business_type || ""
    );

    // Find the launch date answer if available
    const launchDateQuestionIndex = questions.findIndex(
      (q: string) => q.includes("launch") || q.includes("When do you wish")
    );

    let launchDateInfo = "";
    if (launchDateQuestionIndex !== -1 && answers[launchDateQuestionIndex]) {
      launchDateInfo = `\n${
        launchDateQuestionIndex + 1
      }. Your target launch timeframe: ${answers[launchDateQuestionIndex]}`;
    }

    // Create a numbered list of all questions and answers
    const summaryPoints = questions
      .map((question, index) => {
        if (index === launchDateQuestionIndex) return null; // Skip launch date as it's handled separately
        return `${index + 1}. ${question}: ${answers[index]}`;
      })
      .filter(Boolean)
      .join("\n");

    return `Thank you for sharing this information! Based on what you've told me:

${summaryPoints}${launchDateInfo}

${evaluation}

I'll use this information to guide you through your ${currentProject?.business_type} journey. Let's get started with building your business plan!`;
  };

  // Function to evaluate the prequalification answers and provide recommendations
  const evaluatePrequalificationAnswers = (
    answers: string[],
    businessType: string
  ): string => {
    let recommendations = "";

    switch (businessType.toLowerCase()) {
      case "ecommerce":
        // Existing ecommerce evaluation logic
        const investmentMentioned = answers[0].match(
          /\$[\d,]+|[\d,]+\s*(?:dollars|USD)/i
        );
        const timeMentioned = answers[1].match(/\d+\s*(?:hours?|hrs?)/i);
        const hasExperience =
          answers[2].toLowerCase().includes("yes") ||
          answers[2].toLowerCase().includes("experience") ||
          !answers[2].toLowerCase().includes("no");
        const toolComfort =
          answers[3].toLowerCase().includes("comfortable") ||
          answers[3].toLowerCase().includes("familiar") ||
          answers[3].toLowerCase().includes("yes");
        const willingToInvest = !answers[5].toLowerCase().includes("no");

        if (!investmentMentioned) {
          recommendations +=
            "Based on your investment capacity, I recommend starting with a focused product selection and minimal overhead. ";
        }
        if (
          !timeMentioned ||
          answers[1].toLowerCase().includes("few") ||
          answers[1].toLowerCase().includes("little")
        ) {
          recommendations +=
            "Since your time is limited, we'll focus on automation and systems that require minimal daily management. ";
        }
        if (!hasExperience) {
          recommendations +=
            "As you're new to ecommerce, I'll guide you through each step with detailed instructions. Consider starting with a simpler product to learn the basics. ";
        }
        if (!toolComfort) {
          recommendations +=
            "We'll start with the most user-friendly tools and work up to more advanced ones as you gain confidence. ";
        }
        if (!willingToInvest) {
          recommendations +=
            "Since you're cautious about ad spend, we'll focus more on organic growth strategies and smaller, targeted ad tests. ";
        }
        break;

      case "software":
        // Software evaluation logic
        const wantsRecurring = answers[0].toLowerCase().includes("yes");
        const validatesIdeas = answers[1].toLowerCase().includes("yes");
        const hasTechSkills = answers[2].toLowerCase().includes("yes");
        const isPatient = answers[3].toLowerCase().includes("yes");
        const solvesPainPoint = answers[4].toLowerCase().includes("yes");

        if (!wantsRecurring) {
          recommendations +=
            "Since you're not focused on recurring revenue, we'll explore alternative monetization strategies. ";
        }
        if (!validatesIdeas) {
          recommendations +=
            "We'll emphasize the importance of validation before building to save time and resources. ";
        }
        if (!hasTechSkills) {
          recommendations +=
            "We'll focus on no-code and AI tools to help you build without extensive technical knowledge. ";
        }
        if (!isPatient) {
          recommendations +=
            "We'll create a realistic timeline and milestones to help manage expectations. ";
        }
        if (!solvesPainPoint) {
          recommendations +=
            "We'll focus on identifying and solving real market problems rather than following trends. ";
        }
        break;

      case "agency":
        // SMMA evaluation logic
        const willingToOutreach = answers[0].toLowerCase().includes("yes");
        const enjoysPitching = answers[1].toLowerCase().includes("yes");
        const learnsFast = answers[2].toLowerCase().includes("yes");
        const outcomeFocused = answers[3].toLowerCase().includes("yes");
        const willingToScale = answers[4].toLowerCase().includes("yes");

        if (!willingToOutreach) {
          recommendations +=
            "We'll develop alternative client acquisition strategies that don't require daily outreach. ";
        }
        if (!enjoysPitching) {
          recommendations +=
            "We'll focus on building systems and templates to make client acquisition more systematic. ";
        }
        if (!learnsFast) {
          recommendations +=
            "We'll start with simpler platforms and gradually introduce more complex tools. ";
        }
        if (!outcomeFocused) {
          recommendations +=
            "We'll emphasize the importance of setting clear client goals and measuring results. ";
        }
        if (!willingToScale) {
          recommendations +=
            "We'll focus on building a sustainable solo agency model first. ";
        }
        break;

      case "copywriting":
        // Copywriting evaluation logic
        const hasWritingExperience = answers[0].toLowerCase().includes("yes");
        const understandsMarketing = answers[1].toLowerCase().includes("yes");
        const canMeetDeadlines = answers[2].toLowerCase().includes("yes");
        const willingToLearn = answers[3].toLowerCase().includes("yes");
        const hasPortfolio = answers[4].toLowerCase().includes("yes");

        if (!hasWritingExperience) {
          recommendations +=
            "We'll start with basic copywriting exercises and templates to build your skills. ";
        }
        if (!understandsMarketing) {
          recommendations +=
            "We'll focus on learning fundamental marketing principles first. ";
        }
        if (!canMeetDeadlines) {
          recommendations +=
            "We'll develop systems to help you manage time and meet client deadlines. ";
        }
        if (!willingToLearn) {
          recommendations +=
            "We'll emphasize the importance of continuous learning in copywriting. ";
        }
        if (!hasPortfolio) {
          recommendations +=
            "We'll prioritize building a portfolio with sample work. ";
        }
        break;
    }

    return (
      recommendations ||
      `Your profile shows good alignment with ${businessType} business needs. Let's focus on leveraging your strengths while developing areas where you might need more support.`
    );
  };

  // Add new helper function to get current stage data
  const getCurrentStageData = (project: Project): StageData | null => {
    if (!project.current_stage) return null;
    const strategy = getStrategyForBusinessType(project.business_type);
    return strategy[project.current_stage] || null;
  };

  // Add new helper function to get current step data
  const getCurrentStepData = (project: Project): any | null => {
    const stageData = getCurrentStageData(project);
    if (!stageData?.steps || !project.current_step) return null;
    return (
      stageData.steps.find((step) => step.title === project.current_step) ||
      null
    );
  };

  // Update handleSubmit to let AI handle date formatting
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Early return if conditions not met
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // Save user message to chat history
      await saveMessage(userMessage, true);

      // Handle prequalification flow
      if (prequalification.isPrequalifying) {
        await handleNextPrequalificationQuestion(userMessage);
        setIsLoading(false);
        return;
      }

      // Get current stage and step data for context
      const currentStageData = getCurrentStageData(currentProject);
      const currentStepData = getCurrentStepData(currentProject);

      // Initialize project if no todos exist
      if (!currentProject.todos || currentProject.todos.length === 0) {
        await handleProjectInitialization(
          userMessage,
          currentProject,
          currentStageData
        );
        setIsLoading(false);
        return;
      }

      // Detect task completion messages
      if (isTaskCompletionMessage(userMessage)) {
        // Find the first incomplete todo
        const nextIncomplete = getNextIncompleteTodo(currentProject.todos);

        if (nextIncomplete) {
          // Mark the task as complete directly in this function
          const updatedTodos = [...currentProject.todos];
          updatedTodos[nextIncomplete.index] = {
            ...updatedTodos[nextIncomplete.index],
            completed: true,
          };

          // Update todos in the database
          const { error } = await supabase
            .from("projects")
            .update({ todos: updatedTodos })
            .eq("id", currentProject.id);

          if (error) {
            console.error("Error updating todo completion:", error);
            throw error;
          }

          // Update the local state
          setCurrentProject((prev) =>
            prev
              ? {
                  ...prev,
                  todos: updatedTodos,
                }
              : null
          );

          // Generate detailed completion message using multiple personas
          const completionMessage = generateDetailedTaskCompletionMessage(
            nextIncomplete.index + 1,
            nextIncomplete.task.task,
            undefined,
            undefined,
            currentProject.business_type
          );
          await saveMessage(completionMessage, false);

          // Check for the next incomplete task (after the update)
          const newNextIncomplete = getNextIncompleteTodo(updatedTodos);

          if (newNextIncomplete) {
            // Suggest the next task with a delay for better UX
            setTimeout(async () => {
              const nextTaskMessage = generateDetailedTaskCompletionMessage(
                nextIncomplete.index + 1,
                nextIncomplete.task.task,
                newNextIncomplete.index + 1,
                newNextIncomplete.task.task,
                currentProject.business_type
              );
              await saveMessage(nextTaskMessage, false);
              setIsLoading(false);
            }, 1000);
            return;
          } else {
            // All tasks are completed
            setTimeout(async () => {
              const allCompleteMessage = generateDetailedTaskCompletionMessage(
                nextIncomplete.index + 1,
                nextIncomplete.task.task,
                undefined,
                undefined,
                currentProject.business_type
              );
              await saveMessage(allCompleteMessage, false);
              setIsLoading(false);
            }, 1000);
            return;
          }
        }
      }

      // Check for "next task" request
      if (isNextTaskRequest(userMessage)) {
        const nextIncomplete = getNextIncompleteTodo(currentProject.todos);

        if (nextIncomplete) {
          const nextTaskMessage = generateDetailedTaskCompletionMessage(
            0, // No completed task number for this case
            "Moving to next task", // Placeholder text
            nextIncomplete.index + 1,
            nextIncomplete.task.task,
            currentProject.business_type
          );
          await saveMessage(nextTaskMessage, false);
          setIsLoading(false);
          return;
        } else {
          // No more tasks to complete
          const allCompleteMessage = generateDetailedTaskCompletionMessage(
            0, // No completed task number for this case
            "All tasks completed", // Placeholder text
            undefined,
            undefined,
            currentProject.business_type
          );
          await saveMessage(allCompleteMessage, false);
          setIsLoading(false);
          return;
        }
      }

      // Handle todo task mention
      const referencedTodoTask = findTodoTaskByText(
        currentProject.todos,
        userMessage
      );

      console.log("Task reference check:", {
        userMessage,
        referencedTask: referencedTodoTask?.task?.task || "None found",
      });

      // Enhanced task reference detection
      if (referencedTodoTask) {
        console.log("User referenced a specific task:", referencedTodoTask);

        // Check if any previous tasks are incomplete
        const todoIndex = currentProject.todos.findIndex(
          (todo) => todo.task === referencedTodoTask.task.task
        );

        const hasPreviousIncompleteTasks = currentProject.todos
          .slice(0, todoIndex)
          .some((todo) => !todo.completed);

        if (hasPreviousIncompleteTasks && !referencedTodoTask.task.completed) {
          // Find the first incomplete task
          const nextTodo = getNextIncompleteTodo(currentProject.todos);

          if (nextTodo) {
            const encouragementMessage = `I notice you're trying to work on task #${
              todoIndex + 1
            }, but there are previous tasks that need to be completed first. Let's follow the process step by step.\n\nThe next task you should focus on is: **Task #${
              nextTodo.index + 1
            }: ${
              nextTodo.task.task
            }**\n\nWould you like me to help you complete this task first?`;
            await saveMessage(encouragementMessage, false);
            setIsLoading(false);
            return;
          }
        }

        // If this is a "get help with task X" message, provide elaborate solution
        const isTaskHelpRequest =
          userMessage.toLowerCase().includes("help") ||
          userMessage.toLowerCase().includes("how to") ||
          userMessage.toLowerCase().includes("work on") ||
          userMessage.toLowerCase().includes("complete") ||
          userMessage.toLowerCase().includes("do this task") ||
          userMessage.toLowerCase().includes("elaborate");

        if (
          isTaskHelpRequest ||
          userMessage
            .toLowerCase()
            .includes(referencedTodoTask.task.task.toLowerCase())
        ) {
          console.log(
            "Processing task help request for:",
            referencedTodoTask.task.task
          );
          await handleTodoTaskCompletion(
            referencedTodoTask.task,
            currentProject,
            currentStageData,
            currentStepData
          );
          setIsLoading(false);
          return;
        }
      }

      // Check if the message is a direct request for task elaboration without naming a specific task
      const isGenericTaskHelpRequest =
        userMessage.toLowerCase().match(/elaborate( on)? (this )?task/i) ||
        userMessage.toLowerCase().match(/explain( this)? task/i) ||
        userMessage.toLowerCase().match(/help( me)? (with )?(this )?task/i);

      if (isGenericTaskHelpRequest) {
        // Find the first incomplete task
        const nextTodo = getNextIncompleteTodo(currentProject.todos);

        if (nextTodo) {
          console.log(
            "Processing generic task help request for next task:",
            nextTodo.task.task
          );
          await handleTodoTaskCompletion(
            nextTodo.task,
            currentProject,
            currentStageData,
            currentStepData
          );
          setIsLoading(false);
          return;
        }
      }

      // Handle general conversation with blueprint context
      await handleGeneralConversation(
        userMessage,
        currentProject,
        currentStageData,
        currentStepData
      );

      // Auto-mark task as completed if this was a task solution request
      if (userMessage.includes("I need a comprehensive solution for Todo #")) {
        // Extract the task index from the message
        const taskMatch = userMessage.match(/Todo #(\d+):/);
        if (taskMatch && taskMatch[1]) {
          const taskIndex = parseInt(taskMatch[1]) - 1; // Convert to 0-based index

          // Find the todo item
          if (taskIndex >= 0 && taskIndex < currentProject.todos.length) {
            const todoItem = currentProject.todos[taskIndex];

            // Only mark as completed if it's not already completed
            if (!todoItem.completed) {
              // Mark the task as complete
              await handleTodoChange(todoItem.id, true);

              // Add a followup message after a delay
              setTimeout(async () => {
                await saveMessage(
                  "I've automatically marked this task as completed for you. If you need to make changes, you can still uncheck it in the todo list.",
                  false
                );
              }, 500);
            }
          }
        }
      }

      // Update business overview
      await updateBusinessOverview(currentProject);
    } catch (error) {
      console.error("Error in chat:", error);
      await saveMessage(
        "I apologize, but I encountered an error. Please try again.",
        false
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Helper function to find referenced todo task
  const findReferencedTodoTask = (
    userMessage: string,
    currentProject: Project
  ) => {
    if (!currentProject?.todos || currentProject.todos.length === 0) {
      return null;
    }

    // Use the new helper function for fuzzy matching
    const result = findTodoTaskByText(currentProject.todos, userMessage);
    if (result) {
      return result.task;
    }

    // Check if the message mentions any todo by number
    const todoNumberRegex =
      /todo\s+#?(\d+)|task\s+#?(\d+)|(\d+)(st|nd|rd|th)\s+todo|(\d+)(st|nd|rd|th)\s+task/i;
    const match = userMessage.match(todoNumberRegex);

    if (match) {
      const todoNumber =
        parseInt(match[1] || match[2] || match[3] || match[5]) - 1; // Convert to 0-indexed
      if (todoNumber >= 0 && todoNumber < currentProject.todos.length) {
        return currentProject.todos[todoNumber];
      }
    }

    return null;
  };

  // Helper function to handle project initialization
  const handleProjectInitialization = async (
    userMessage: string,
    currentProject: Project,
    currentStageData: StageData | null
  ) => {
    // Handle budget setting
    if (!currentProject.total_budget) {
      const budget = extractBudget(userMessage);
      if (!budget) {
        await saveMessage(
          "Please specify your budget for this business. For example: 'My budget is $5,000' or 'I have $2,500 to invest'.",
          false
        );
        return;
      }

      await updateProjectBudget(currentProject, budget);
      await promptForIncomeGoal(currentProject);
      return;
    }

    // Handle income goal setting
    const incomeGoal = extractIncomeGoal(userMessage);
    if (!incomeGoal) {
      await saveMessage(
        "Please specify your monthly income goal. For example: 'I want to earn $5,000 per month' or 'My target is $2,500 monthly'.",
        false
      );
      return;
    }

    await updateProjectIncomeGoal(currentProject, incomeGoal);
    await generateInitialTodos(currentProject, currentStageData);
  };

  // Helper function to handle todo task completion
  const handleTodoTaskCompletion = async (
    todoTask: TodoItem,
    currentProject: Project,
    currentStageData: StageData | null,
    currentStepData: any
  ) => {
    const todoIndex = currentProject.todos.findIndex(
      (t) => t.task === todoTask.task
    );

    // Check if trying to skip ahead
    const previousTodosCompleted = currentProject.todos
      .slice(0, todoIndex)
      .every((todo) => todo.completed);

    if (!previousTodosCompleted) {
      // Find the first incomplete todo
      const nextTodo = getNextIncompleteTodo(currentProject.todos);

      if (nextTodo) {
        const encouragementMessage = `I notice you're trying to work on task #${
          todoIndex + 1
        }, but there are previous tasks that need to be completed first. Let's follow the process step by step.

The next task you should focus on is: **Task #${nextTodo.index + 1}: ${
          nextTodo.task.task
        }**

Would you like me to help you complete this task first?`;

        await saveMessage(encouragementMessage, false);
        return;
      } else {
        // Fallback to general encouragement if no next todo is found (shouldn't happen)
        const encouragementMessage = await getAIChatResponse(
          messages,
          "Generate an encouraging message reminding the user they need to complete previous tasks first. Reference the specific current task they should focus on.",
          currentProject,
          selectedModel,
          true // Skip automatic task completion
        );
        await saveMessage(encouragementMessage, false);
        return;
      }
    }

    // Check if this is a product research task for ecommerce
    const taskLower = todoTask.task.toLowerCase();
    const isProductResearchTask =
      currentProject.business_type === "ecommerce" &&
      (taskLower.includes("product research") ||
        taskLower.includes("find products") ||
        taskLower.includes("identify products") ||
        taskLower.includes("product selection") ||
        taskLower.includes("market research") ||
        taskLower.includes("niche selection") ||
        taskLower.includes("product ideas"));

    if (isProductResearchTask) {
      try {
        // Extract or use default personas
        let personas: string[] = [];

        // Try to extract personas from previous messages or outputs
        if (currentProject.outputs?.prequalification?.answers) {
          // Get answers that might contain persona information
          const answers = currentProject.outputs.prequalification.answers;

          // Typical questions about target market are in early positions
          if (answers.length >= 3) {
            const potentialPersonaAnswers = answers.slice(0, 3);

            // Extract sentences that might describe personas
            potentialPersonaAnswers.forEach((answer) => {
              const sentences = answer
                .split(/[.!?]+/)
                .filter((s) => s.trim().length > 0);
              sentences.forEach((sentence) => {
                if (
                  sentence.toLowerCase().includes("target") ||
                  sentence.toLowerCase().includes("customer") ||
                  sentence.toLowerCase().includes("audience") ||
                  sentence.toLowerCase().includes("demographic")
                ) {
                  personas.push(sentence.trim());
                }
              });
            });
          }
        }

        // If no personas were found, use some defaults based on typical ecommerce customers
        if (personas.length === 0) {
          personas = [
            "Health-conscious millennials aged 25-35",
            "Tech-savvy professionals working from home",
            "Environmentally conscious consumers",
            "Parents of young children looking for convenient solutions",
          ];
        }

        // Extract budget from project or use default
        const budget = currentProject.total_budget || "$1000-$5000";

        // Generate product recommendations
        const productRecommendations =
          await generateEcommerceProductRecommendations(personas, budget);

        // Format the recommendations into a nice response
        const formattedResponse = formatProductRecommendations(
          productRecommendations
        );

        // Send the product recommendations
        await saveMessage(formattedResponse, false);

        // Automatically mark the task as complete after a short delay
        setTimeout(async () => {
          try {
            // Find the todo ID which is required by handleTodoChange
            const todoId = todoTask.id || todoTask.task;

            // Mark task as complete using handleTodoChange with the correct parameters
            await handleTodoChange(todoId, true);

            // Add a followup message
            await saveMessage(
              "I've automatically marked this product research task as complete. These product suggestions are based on current market trends and the personas identified for your business. Would you like to explore any specific product in more detail?",
              false
            );
          } catch (error) {
            console.error("Error marking task complete:", error);
          }
        }, 1500);

        return;
      } catch (error) {
        console.error("Error generating product recommendations:", error);
        // Fall back to the default handling if there's an error
      }
    }

    // Generate enhanced prompt with blueprint context
    const enhancedPrompt = generateEnhancedPrompt(
      currentProject,
      currentStageData,
      currentStepData,
      todoTask
    );

    const aiResponse = await getAIChatResponse(
      messages,
      enhancedPrompt,
      currentProject,
      selectedModel,
      true // Skip automatic task completion
    );

    await saveMessage(aiResponse, false);

    // Automatically mark the task as complete if it's the currently focused one
    if (
      todoIndex === currentProject.todos.findIndex((todo) => !todo.completed)
    ) {
      // Automatically mark the task as complete
      setTimeout(async () => {
        try {
          // Find the todo ID
          const todoId = todoTask.id || todoTask.task;

          // Mark the task as complete
          await handleTodoChange(todoId, true);

          // Send a confirmation message
          const completionMessage = `I've marked task #${
            todoIndex + 1
          } as complete. Are you satisfied with the response and want to move to the next task?`;
          await saveMessage(completionMessage, false);
        } catch (error) {
          console.error("Error marking task complete:", error);
        }
      }, 1000);
    }
  };

  // Helper function to handle general conversation
  const handleGeneralConversation = async (
    userMessage: string,
    currentProject: Project,
    currentStageData: StageData | null,
    currentStepData: any
  ) => {
    const conversationPrompt = generateConversationPrompt(
      userMessage,
      currentProject,
      currentStageData,
      currentStepData
    );

    const aiResponse = await getAIChatResponse(
      messages,
      conversationPrompt,
      currentProject,
      selectedModel,
      true // Skip automatic task completion since the component already handles it
    );

    await saveMessage(aiResponse, false);
  };

  // Helper function to update business overview
  const updateBusinessOverview = async (currentProject: Project) => {
    const businessOverview = await generateBusinessOverviewSummary(
      currentProject,
      messages
    );

    const { error: overviewError } = await supabase
      .from("projects")
      .update({ business_overview_summary: businessOverview })
      .eq("id", currentProject.id);

    if (overviewError) throw overviewError;

    setCurrentProject((prev) =>
      prev ? { ...prev, business_overview_summary: businessOverview } : null
    );
  };

  // Helper function to generate enhanced prompt
  const generateEnhancedPrompt = (
    currentProject: Project,
    currentStageData: StageData | null,
    currentStepData: any,
    todoTask: TodoItem
  ) => {
    // Get the todo index to provide context about where we are in the sequence
    const todoIndex = currentProject.todos.findIndex(
      (t) => t.task === todoTask.task
    );

    // Get previous and next todos for context
    const previousTodo =
      todoIndex > 0 ? currentProject.todos[todoIndex - 1] : null;
    const nextTodo =
      todoIndex < currentProject.todos.length - 1
        ? currentProject.todos[todoIndex + 1]
        : null;

    // Check if this is a gap analysis task
    const isGapAnalysisTask =
      todoTask.task.toLowerCase().includes("gap") &&
      todoTask.task.toLowerCase().includes("analysis");

    // Base prompt context
    let prompt = `Help the user complete this task from their ${
      currentProject.business_type
    } business blueprint:

Current Stage: ${currentProject.current_stage || ""}
Stage Objective: ${currentStageData?.objective || ""}
Current Step: ${currentStepData?.title || ""}
Step Details: ${currentStepData?.description || ""}

CURRENT TASK: "${todoTask.task}"
${
  previousTodo
    ? `Previous Task: "${previousTodo.task}" (${
        previousTodo.completed ? "Completed" : "Not Completed"
      })`
    : ""
}
${nextTodo ? `Next Task: "${nextTodo.task}"` : ""}

`;

    // Add task-specific instructions
    if (isGapAnalysisTask) {
      prompt += `For this gap analysis task, identify the actual gaps in the user's business plan or market. Do not provide steps to complete the task. Instead:

1. Identify 5-7 specific gaps that exist for the user's ${currentProject.business_type} business
2. For each gap, provide:
   - A clear description of the gap
   - Why this gap matters to their business success
   - The potential impact of not addressing this gap
   - A brief recommendation on how to address it
3. Prioritize these gaps from most critical to least critical
4. Summarize the key findings at the beginning of your response

Format your response as an actual gap analysis report with clear headings and sections. The user doesn't need step-by-step instructions for performing a gap analysis - they need you to actually perform the analysis and show them the results.`;
    } else {
      prompt += `Provide specific, actionable guidance to complete this task. Include:

1. Step-by-step instructions from start to finish (minimum 5 steps with detailed explanations)
2. Recommended tools or platforms to use (with specific recommendations, not just generic options)
3. 3 specific examples or templates that apply to their business type
4. Success criteria so they know when they've successfully completed the task
5. Common pitfalls to avoid
6. Resources for further learning

Format your response in markdown with clear sections, bullet points, and numbered lists. Make it easy for the user to follow along.`;
    }

    prompt += `\n\nRemember this is task #${todoIndex + 1} of ${
      currentProject.todos.length
    } in their business plan. Your guidance should be comprehensive enough that they can complete this task without needing additional help.`;

    return prompt;
  };

  // Helper function to generate conversation prompt
  const generateConversationPrompt = (
    userMessage: string,
    currentProject: Project,
    currentStageData: StageData | null,
    currentStepData: any
  ) => {
    // Get the next incomplete todo for context
    const nextIncomplete = getNextIncompleteTodo(currentProject.todos);
    const todoProgress = currentProject.todos
      ? `${currentProject.todos.filter((t) => t.completed).length}/${
          currentProject.todos.length
        }`
      : "0/0";

    // Count how many todos are completed to give appropriate guidance
    const completedTodos = currentProject.todos
      ? currentProject.todos.filter((t) => t.completed).length
      : 0;
    const totalTodos = currentProject.todos ? currentProject.todos.length : 0;
    const allTodosCompleted = completedTodos === totalTodos && totalTodos > 0;

    return `You are helping the user with their ${
      currentProject.business_type || ""
    } business.

Current Stage: ${currentProject.current_stage || ""}
Stage Objective: ${currentStageData?.objective || ""}
Current Step: ${currentStepData?.title || ""}
Step Details: ${currentStepData?.description || ""}
Todo Progress: ${todoProgress} tasks completed

${
  nextIncomplete
    ? `Next Incomplete Task: Task #${nextIncomplete.index + 1}: ${
        nextIncomplete.task.task
      }`
    : allTodosCompleted
    ? "All tasks are completed for this stage!"
    : "No tasks available."
}

User Message: ${userMessage}

Provide guidance that aligns with their current stage and step in the business blueprint. Keep these guidelines in mind:

1. Always prioritize helping them complete their next todo task in sequence
2. Provide specific, actionable advice relevant to their business type
3. If they ask about something unrelated to their current tasks, still answer helpfully but gently guide them back to their business plan
4. If they're confused about what to do next, remind them of their next incomplete task
5. Remember that tasks should be completed in sequential order for the best results

Your goal is to help them successfully build their ${
      currentProject.business_type || ""
    } business by following the structured plan and completing tasks in order.`;
  };

  // Add a function to show toast message
  const showToast = (message: string, isSuccess: boolean = false) => {
    const id = Date.now().toString();
    setToasts((prev) => [
      ...prev,
      { id, message, type: isSuccess ? "success" : "info" },
    ]);

    // Remove the toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Modify handleTodoChange function to check previous todos
  const handleTodoChange = async (todoTask: string, completed: boolean) => {
    if (!currentProject) return;

    try {
      console.log("Todo change initiated:", { todoTask, completed });

      // Get the todo item index
      const todoIndex = currentProject.todos.findIndex(
        (todo) => todo.task === todoTask
      );
      if (todoIndex === -1) {
        console.error("Todo task not found:", todoTask);
        return;
      }

      console.log("Found todo at index:", todoIndex);

      // Check if trying to complete a task out of order
      if (completed && todoIndex > 0) {
        // Check if any previous tasks are incomplete
        const hasPreviousIncompleteTasks = currentProject.todos
          .slice(0, todoIndex)
          .some((todo) => !todo.completed);

        if (hasPreviousIncompleteTasks) {
          // Find the first incomplete previous task
          const firstIncompletePrevTask = currentProject.todos
            .slice(0, todoIndex)
            .findIndex((todo) => !todo.completed);

          const incompleteTaskNum = firstIncompletePrevTask + 1;

          showToast(
            `Complete task #${incompleteTaskNum} first before moving to task #${
              todoIndex + 1
            }`,
            false
          );
          return;
        }
      }

      // Update the todo item in the local state
      const updatedTodos = currentProject.todos.map((todo) =>
        todo.task === todoTask ? { ...todo, completed } : todo
      );

      // Get the number of completed todos before and after this change
      const previouslyCompletedCount = currentProject.todos.filter(
        (todo) => todo.completed
      ).length;
      const newCompletedCount = updatedTodos.filter(
        (todo) => todo.completed
      ).length;
      const totalTodos = updatedTodos.length;

      console.log("Todo completion stats:", {
        previouslyCompletedCount,
        newCompletedCount,
        totalTodos,
      });

      // Check if this was the last todo being completed
      const isLastTodoCompleted =
        previouslyCompletedCount === totalTodos - 1 &&
        newCompletedCount === totalTodos;
      const currentStage = currentProject.current_stage as StageKey;

      console.log("Stage transition check:", {
        isLastTodoCompleted,
        currentStage,
        completedBefore: previouslyCompletedCount,
        completedAfter: newCompletedCount,
        total: totalTodos,
      });

      // Show appropriate toast message
      if (completed) {
        showToast(`Task #${todoIndex + 1} completed!`, true);

        // Check if we recently sent a completion message for this task
        const lastMessage = messages[messages.length - 1];
        const secondLastMessage =
          messages.length > 1 ? messages[messages.length - 2] : null;

        // Check if the last message is from the AI and contains task completion text
        const isLastMessageTaskCompletion =
          lastMessage &&
          !lastMessage.is_user &&
          lastMessage.content.includes(
            `Congratulations on completing Task #${todoIndex + 1}`
          );

        // Also check the second-to-last message (in case user just sent something)
        const isSecondLastMessageTaskCompletion =
          secondLastMessage &&
          !secondLastMessage.is_user &&
          secondLastMessage.content.includes(
            `Congratulations on completing Task #${todoIndex + 1}`
          );

        // Find the next incomplete task to suggest it automatically
        if (
          todoIndex === previouslyCompletedCount &&
          !isLastMessageTaskCompletion &&
          !isSecondLastMessageTaskCompletion
        ) {
          // This was the next task in sequence that was completed and we haven't sent a completion message yet
          const nextIncompleteIndex = updatedTodos.findIndex(
            (todo) => !todo.completed
          );
          if (nextIncompleteIndex !== -1) {
            // Show next task message in chat
            setTimeout(async () => {
              // Use the new detailed message with a unique timestamp
              const detailedCompletionMessage =
                generateDetailedTaskCompletionMessage(
                  todoIndex + 1,
                  updatedTodos[todoIndex].task,
                  nextIncompleteIndex + 1,
                  updatedTodos[nextIncompleteIndex].task,
                  currentProject.business_type
                );
              await saveMessage(detailedCompletionMessage, false);
            }, 500);
          } else {
            // All tasks completed
            setTimeout(async () => {
              const detailedCompletionMessage =
                generateDetailedTaskCompletionMessage(
                  todoIndex + 1,
                  updatedTodos[todoIndex].task,
                  undefined,
                  undefined,
                  currentProject.business_type
                );
              await saveMessage(detailedCompletionMessage, false);
            }, 500);
          }
        }
      } else {
        showToast(`Task #${todoIndex + 1} marked as incomplete`);
      }

      // Update todos in database first (without stage change)
      const { error: updateError } = await supabase
        .from("projects")
        .update({ todos: updatedTodos })
        .eq("id", currentProject.id);

      if (updateError) {
        console.error("Error updating todos:", updateError);
        throw updateError;
      }

      // Update local project state with updated todos
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: updatedTodos,
        };
      });

      // If this was the last todo completed, handle stage transition
      if (isLastTodoCompleted && currentStage) {
        // Check if we've already shown a stage completion message
        const lastMessageIsStageCompletion =
          messages.length > 0 &&
          !messages[messages.length - 1].is_user &&
          messages[messages.length - 1].content.includes("Stage Complete!");

        if (lastMessageIsStageCompletion) {
          console.log(
            "Already showed stage completion message, skipping duplicate"
          );
          // Skip sending another stage completion message
        } else {
          // Get the next stage
          const nextStage = getNextStage(currentStage);
          console.log("Stage transition:", { currentStage, nextStage });

          if (nextStage) {
            showToast(
              `All tasks completed! Moving to ${nextStage
                .replace("_", " ")
                .toUpperCase()} stage`,
              true
            );

            try {
              // Generate new todos for the next stage
              const newTodos = await updateTodosForStage(
                nextStage,
                currentProject
              );
              console.log(
                "New todos generated for next stage:",
                newTodos?.length || 0
              );

              if (newTodos) {
                // Update the project with new stage and todos
                const { error } = await supabase
                  .from("projects")
                  .update({
                    current_stage: nextStage,
                    todos: newTodos,
                    completed_stages: [
                      ...(currentProject.completed_stages || []),
                      currentStage,
                    ],
                  })
                  .eq("id", currentProject.id);

                if (error) {
                  console.error("Error updating project stage:", error);
                  throw error;
                }

                console.log("Database updated with new stage and todos");

                // Update local project state
                setCurrentProject((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    current_stage: nextStage,
                    todos: newTodos,
                    completed_stages: [
                      ...(prev.completed_stages || []),
                      currentStage,
                    ],
                  };
                });

                // Generate and save stage introduction message
                const stageIntro = generateStageIntroduction(
                  currentProject.business_type,
                  nextStage
                );

                console.log("Generated stage intro for new stage");

                // Save the stage introduction message
                await saveMessage(stageIntro, false);

                // Update business overview after stage change
                const updatedMessages = [...messages];
                const businessOverview = await generateBusinessOverviewSummary(
                  {
                    ...currentProject,
                    current_stage: nextStage,
                    todos: newTodos,
                  },
                  updatedMessages
                );

                // Update project with new business overview
                const { error: overviewError } = await supabase
                  .from("projects")
                  .update({ business_overview_summary: businessOverview })
                  .eq("id", currentProject.id);

                if (overviewError) {
                  console.error(
                    "Error updating business overview:",
                    overviewError
                  );
                  throw overviewError;
                }

                // Update local project state with new business overview
                setCurrentProject((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    business_overview_summary: businessOverview,
                  };
                });

                console.log("Stage transition completed successfully");
                return; // Exit early since we've already updated everything
              }
            } catch (error) {
              console.error("Error during stage transition:", error);
              showToast("Error moving to next stage. Please try again.", false);
            }
          } else {
            console.log("No next stage available after:", currentStage);
          }
        }
      }

      // Update business overview in real time
      const updatedMessages = [...messages];
      const businessOverview = await generateBusinessOverviewSummary(
        { ...currentProject, todos: updatedTodos },
        updatedMessages
      );

      // Update project with new business overview
      const { error: overviewError } = await supabase
        .from("projects")
        .update({ business_overview_summary: businessOverview })
        .eq("id", currentProject.id);

      if (overviewError) {
        console.error("Error updating business overview:", overviewError);
        throw overviewError;
      }

      // Update local project state with new business overview
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          business_overview_summary: businessOverview,
        };
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      showToast("Failed to update task. Please try again.", false);
    }
  };

  // Modify the Get Started button click handler
  const handleGetStarted = (todoItem: TodoItem) => {
    if (!currentProject?.todos) {
      showToast("No tasks available");
      return;
    }

    // Get the index of the current todo
    const index = currentProject.todos.findIndex(
      (t) => t.task === todoItem.task
    );
    if (index === -1) {
      showToast("Task not found");
      return;
    }

    // Check if all previous todos are completed
    const previousTodosCompleted = currentProject.todos
      .slice(0, index)
      .every((prevTodo) => prevTodo.completed);

    if (!previousTodosCompleted) {
      // Find the first incomplete previous task
      const firstIncompletePrevTask = currentProject.todos
        .slice(0, index)
        .findIndex((todo) => !todo.completed);

      // firstIncompletePrevTask will be a valid index since we already know previousTodosCompleted is false
      const incompleteTaskNum = firstIncompletePrevTask + 1;

      showToast(`Please complete task #${incompleteTaskNum} first`);
      return;
    }

    // If this task is already completed, ask if user wants to revisit
    if (todoItem.completed) {
      // // Format task message for the AI
      // setInputMessage(
      //   `Complete Task #${index + 1}: "${
      //     todoItem.task
      //   }" for me. I need the full solution for my ${
      //     currentProject?.business_type
      //   } business, not instructions. Please deliver the finished result directly.`
      // );
    } else {
      // Format task message for the AI
      setInputMessage(
        `"${todoItem.task}" for me. I need the full solution for my ${currentProject?.business_type} business, not instructions. Please deliver the finished result directly.`
      );
    }

    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        adjustTextareaHeight();
      }, 0);
    }
  };

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupMessage.trim() || isPopupLoading || !currentProject) return;

    const userMessage = popupMessage.trim();
    setPopupMessage("");
    setIsPopupLoading(true);

    // Add user message to temporary state
    const userPopupMessage = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
    };
    setPopupMessages((prev) => [...prev, userPopupMessage]);

    try {
      // Check if the message is about generating images or logos
      if (isImageGenerationRequest(userMessage)) {
        const aiPopupMessage = {
          id: Date.now().toString(),
          content:
            "I'm sorry, but I don't support image or logo generation right now. This feature is coming soon on Mentar AI! In the meantime, I can help you with planning, strategy, and text-based content for your business.",
          isUser: false,
        };
        setPopupMessages((prev) => [...prev, aiPopupMessage]);
        setIsPopupLoading(false);
        return;
      }

      // Use the getAIChatResponse utility function instead of implementing the API call here
      // Convert popup messages to the format expected by getAIChatResponse
      const formattedMessages = popupMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        is_user: msg.isUser,
        created_at: new Date().toISOString(),
      }));

      // Prepare prequalification context if available for ecommerce businesses
      let prequalificationContext = "";
      if (
        currentProject.business_type === "ecommerce" &&
        currentProject.outputs?.prequalification &&
        Array.isArray(currentProject.outputs.prequalification.answers)
      ) {
        const questions = ecommerceBlueprint.preQualification.questions;
        const answers = currentProject.outputs.prequalification.answers;

        prequalificationContext = "\n\nPrequalification Information:\n";
        for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
          prequalificationContext += `- ${questions[i]}: ${answers[i]}\n`;
        }
      }

      let aiResponse = await getAIChatResponse(
        formattedMessages,
        userMessage + prequalificationContext,
        currentProject,
        selectedModel,
        true // Skip automatic task completion in popup chat
      );

      // Add a follow-up question to the popup response if not already present
      if (
        !aiResponse.endsWith("?") &&
        !aiResponse.includes("Are you satisfied with")
      ) {
        // Get the first incomplete todo
        const firstIncompleteTodo = currentProject.todos?.find(
          (todo) => !todo.completed
        );
        if (firstIncompleteTodo) {
          aiResponse +=
            "\n\nWould you like me to help you with your current task?";
        } else {
          aiResponse += "\n\nIs there anything else you'd like help with?";
        }
      }

      // Add AI response to popup messages
      const aiPopupMessage = {
        id: Date.now().toString(),
        content: aiResponse,
        isUser: false,
      };
      setPopupMessages((prev) => [...prev, aiPopupMessage]);
      setPopupMessage("");
      setIsPopupLoading(false);
    } catch (error) {
      console.error("Error in popup chat:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error. Please try again.",
        isUser: false,
      };
      setPopupMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsPopupLoading(false);
      // Focus the popup input field after the AI response
      setTimeout(() => {
        if (popupInputRef.current) {
          popupInputRef.current.focus();
          adjustPopupTextareaHeight();
        }
      }, 100);
    }
  };

  const adjustPopupTextareaHeight = () => {
    const textarea = popupInputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Max height of 120px
    }
  };

  const handlePopupInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPopupMessage(e.target.value);
    adjustPopupTextareaHeight();
  };

  const handlePopupKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePopupSubmit(e as any);
    }
  };

  // Add a function to toggle todo expansion
  const toggleTodoExpansion = (todoId: string) => {
    setExpandedTodos((prev) => ({
      ...prev,
      [todoId]: !prev[todoId],
    }));
  };

  useEffect(() => {
    // Focus input and adjust height when messages change
    if (inputRef.current) {
      inputRef.current.focus();
      adjustTextareaHeight();
    }
  }, [messages]);

  // Define markdown components configuration
  const markdownComponents: Components = {
    code({ node, className, children, ...props }) {
      const language = className ? className.replace(/language-/, "") : "";

      if (!className) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      }

      return (
        <div className="markdown-code-block">
          <div className="code-header">
            {language && <span className="code-language">{language}</span>}
            <button
              className="copy-button"
              onClick={() => {
                const code = String(children).replace(/\n$/, "");
                navigator.clipboard.writeText(code);
              }}
            >
              Copy
            </button>
          </div>
          <pre className={className}>
            <code {...props}>{children}</code>
          </pre>
        </div>
      );
    },
    a({ node, href, children, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link"
          {...props}
        >
          {children}
        </a>
      );
    },
    p({ children }) {
      return <p className="markdown-paragraph">{children}</p>;
    },
    ul({ children }) {
      return <ul className="markdown-list">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="markdown-list">{children}</ol>;
    },
    li({ children }) {
      return <li className="markdown-list-item">{children}</li>;
    },
    h1({ children }) {
      return <h1 className="markdown-heading markdown-h1">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="markdown-heading markdown-h2">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="markdown-heading markdown-h3">{children}</h3>;
    },
    h4({ children }) {
      return <h4 className="markdown-heading markdown-h4">{children}</h4>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="markdown-blockquote">{children}</blockquote>
      );
    },
    table({ children }) {
      return (
        <div className="markdown-table-container">
          <table className="markdown-table">{children}</table>
        </div>
      );
    },
  };

  // Add the generateStageIntroduction function
  const generateStageIntroduction = (
    businessType: string,
    stage: StageKey
  ): string => {
    const stageData = getStrategyForBusinessType(businessType)[stage];
    if (!stageData) return "";

    const stageNumber = stage.replace("stage_", "");
    const stageTitle = stageNumber.toUpperCase();

    return `## Stage ${stageNumber}: ${stageData.objective}

Welcome to Stage ${stageNumber} of your ${businessType} business journey! In this stage, we'll focus on ${stageData.objective.toLowerCase()}.

${stageData.description || ""}

Let's get started with the following tasks:`;
  };

  // Update the stage display to handle null case
  const renderStageTitle = (stage: StageKey | null): string => {
    if (!stage) return "";
    const words = stage.split("_");
    return words
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const updateProjectState = (updates: Partial<Project>) => {
    setCurrentProject((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates } as Project;
    });
  };

  const updateTodosForStage = async (
    stage: StageKey,
    currentProject: Project
  ) => {
    // Get new todos for the stage
    const newTodos = await generateTodosForStage(
      currentProject.business_type,
      stage,
      currentProject
    );

    if (!newTodos) {
      console.error("Failed to generate todos for stage:", stage);
      return null;
    }

    // Update project with proper stage type
    const { error } = await supabase
      .from("projects")
      .update({
        todos: newTodos,
        current_stage: stage,
        completed_stages: [...(currentProject.completed_stages || []), stage],
      })
      .eq("id", currentProject.id);

    if (error) {
      console.error("Error updating todos for stage:", error);
      return null;
    }

    // Update local state using the helper function
    updateProjectState({
      todos: newTodos,
      current_stage: stage,
      completed_stages: [...(currentProject.completed_stages || []), stage],
    });

    // Generate stage introduction with correct arguments
    const stageIntro = generateStageIntroduction(
      currentProject.business_type,
      stage
    );

    // Save the stage introduction message
    await saveMessage(stageIntro, false);

    return newTodos;
  };

  // Update the generateTodosForStage function to handle all business types
  const generateTodosForStage = async (
    businessType: string,
    stage: StageKey,
    project: Project
  ): Promise<any[] | null> => {
    try {
      switch (businessType) {
        case "ecommerce":
          return await generateEcommerceTodos(stage, project as any);
        case "software":
          return await generateSoftwareTodos(stage, project as any);
        case "agency":
          return await generateSMMATodos(stage, project as any);
        case "copywriting":
          return await generateCopywritingTodos(stage, project as any);
        default:
          console.error("Unsupported business type:", businessType);
          return null;
      }
    } catch (error) {
      console.error("Error generating todos:", error);
      return null;
    }
  };

  // Update the stage transition handling
  const handleStageTransition = async (newStage: StageKey) => {
    if (!currentProject) return;

    const updatedTodos = await updateTodosForStage(newStage, currentProject);
    if (!updatedTodos) {
      console.error("Failed to update todos for stage:", newStage);
      return;
    }

    // Update UI state
    setTodos(updatedTodos);
    setCurrentStep(null);
  };

  // Helper function to update project budget
  const updateProjectBudget = async (
    currentProject: Project,
    budget: string | null
  ) => {
    if (!budget) {
      throw new Error("Budget cannot be null");
    }

    const budgetString = budget.toString();
    const { error: budgetUpdateError } = await supabase
      .from("projects")
      .update({ total_budget: budgetString })
      .eq("id", currentProject.id);

    if (budgetUpdateError) throw budgetUpdateError;

    setCurrentProject((prev) =>
      prev ? { ...prev, total_budget: budgetString } : null
    );
  };

  // Helper function to prompt for income goal
  const promptForIncomeGoal = async (currentProject: Project) => {
    const strategy = getStrategyForBusinessType(currentProject.business_type);
    const incomeGoalPrompt =
      strategy.preQualification?.questions?.find(
        (q) =>
          q.toLowerCase().includes("income") ||
          q.toLowerCase().includes("revenue")
      ) ||
      `What's your target monthly income goal for this ${currentProject.business_type} business?`;

    await saveMessage(incomeGoalPrompt, false);
  };

  // Helper function to update project income goal
  const updateProjectIncomeGoal = async (
    currentProject: Project,
    incomeGoal: string | number | null
  ) => {
    if (incomeGoal === null) {
      throw new Error("Income goal cannot be null");
    }

    const incomeGoalString = incomeGoal.toString();
    const { error: incomeGoalUpdateError } = await supabase
      .from("projects")
      .update({ income_goal: incomeGoalString })
      .eq("id", currentProject.id);

    if (incomeGoalUpdateError) throw incomeGoalUpdateError;

    setCurrentProject((prev) =>
      prev ? { ...prev, income_goal: incomeGoalString } : null
    );
  };

  // Helper function to generate initial todos
  const generateInitialTodos = async (
    currentProject: Project,
    currentStageData: StageData | null
  ) => {
    setIsGeneratingTodos(true);

    try {
      // Validate business type
      const validBusinessTypes = [
        "ecommerce",
        "software",
        "agency",
        "copywriting",
      ];
      if (
        !validBusinessTypes.includes(currentProject.business_type.toLowerCase())
      ) {
        throw new Error(
          `Invalid business type: ${
            currentProject.business_type
          }. Must be one of: ${validBusinessTypes.join(", ")}`
        );
      }

      // Generate initial todos
      const generatedTodos = await generateTodosForProject(
        currentProject.id,
        currentProject.business_type.toLowerCase(),
        currentProject.total_budget
      );

      // Update project with todos and initial stage
      const { error: todosUpdateError } = await supabase
        .from("projects")
        .update({
          todos: generatedTodos,
          tasks_in_progress: [],
          current_stage: "stage_1",
          current_step: currentStageData?.steps?.[0]?.title || null,
        })
        .eq("id", currentProject.id);

      if (todosUpdateError) throw todosUpdateError;

      // Fetch updated project
      const { data: updatedProject, error: fetchUpdateError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", currentProject.id)
        .single();

      if (fetchUpdateError) throw fetchUpdateError;

      // Update local state
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          todos: generatedTodos || [],
          tasks_in_progress: [],
          current_stage: "stage_1",
          current_step: currentStageData?.steps?.[0]?.title || null,
          expected_launch_date: updatedProject.expected_launch_date,
        };
      });

      // Generate stage introduction
      const stageIntro = `We are stage ${
        currentProject?.current_stage || "1"
      } of building your successful business

${currentStageData?.objective || ""}

${currentStageData?.steps?.[0]?.title || ""}

Your first task is ready. Would you like to get started?`;

      // Add launch date message if available
      if (updatedProject.expected_launch_date) {
        const launchDateMessage = await generateLaunchDateMessage(
          updatedProject.expected_launch_date,
          currentProject.id
        );
        if (launchDateMessage) {
          await saveMessage(launchDateMessage, false);
        }
      }

      await saveMessage(stageIntro, false);
    } catch (error) {
      console.error("Error generating todos:", error);
      await saveMessage(
        "I apologize, but I encountered an error while generating your business plan. Please try again or contact support if the issue persists.",
        false
      );
    } finally {
      setIsGeneratingTodos(false);
    }
  };

  // Add a function to handle model change
  const handleModelChange = async (model: "gpt-3.5-turbo" | "gpt-4") => {
    if (!currentProject || isLoading) return;

    setSelectedModel(model);

    try {
      // Update the model in the database
      const { error } = await supabase
        .from("projects")
        .update({ selected_model: model })
        .eq("id", currentProject.id);

      if (error) {
        console.error("Error updating model preference:", error);
        showToast("Failed to save model preference", false);
      }
    } catch (error) {
      console.error("Error in handleModelChange:", error);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      {/* Toast Container */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast ${toast.type || "info"}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Overlay for Todo Generation */}
      {isGeneratingTodos && (
        <div className="todo-generation-overlay">
          <div className="todo-generation-dialog">
            <div className="loading-spinner"></div>
            <h3>Personalising your Business</h3>
            <p>Creating tailored action items for your business plan...</p>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      {currentProject && (
        <div className="projects-list-panel">
          {/* Project Selector */}
          <div className="project-selector">
            <div
              className="project-selector-header"
              onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
            >
              <div className="project-type-container">
                <span className="project-type">
                  {currentProject.business_type}
                </span>
                <span className="project-date">
                  {new Date(currentProject.created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: isProjectSelectorOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              className={`project-selector-content ${
                isProjectSelectorOpen ? "open" : ""
              }`}
            >
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-selector-item ${
                    currentProject?.id === project.id ? "active" : ""
                  }`}
                  onClick={() => {
                    handleProjectSwitch(project);
                    setIsProjectSelectorOpen(false);
                  }}
                >
                  <span>{project.business_type}</span>
                  <div
                    // className="delete-project"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                  >
                    <FaTrashCan />
                  </div>
                </div>
              ))}
              {/* New Project option inside dropdown */}
              <div
                className="project-selector-item new-project-item"
                onClick={() => {
                  handleNewProject();
                  setIsProjectSelectorOpen(false);
                }}
              >
                <span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  New Project
                </span>
              </div>
            </div>
          </div>

          {/* Business Overview */}
          <div className="overview-container">
            <h2>
              {/* <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12H15V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}
              Business Overview
            </h2>
            <div className="overview-content">
              {currentProject.business_overview_summary ||
                "No overview available yet. Start chatting to build your business plan!"}
            </div>
          </div>

          {/* Launch Date Container */}
          <div className="launch-date-container">
            <h2>
              {/* <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 10H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}
              Expected Launch
            </h2>
            <div className="launch-date-content">
              <div className="launch-date-display">
                {currentProject?.expected_launch_date
                  ? new Date(
                      currentProject.expected_launch_date
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Your launch date will be set based on your answer to the prequalification question about when you wish to launch."}
              </div>
              {currentProject?.expected_launch_date && (
                <div className="countdown-timer">
                  <div className="countdown-item">
                    <span className="countdown-value">
                      {Math.ceil(
                        (new Date(
                          currentProject.expected_launch_date
                        ).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </span>
                    <span className="countdown-label">Days Until Launch</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <motion.button
            className="settings-button"
            onClick={handleSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Settings
          </motion.button>
        </div>
      )}

      {/* Right Sidebar - Todo List Only */}
      {currentProject && (
        <div className="right-sidebar">
          <div className="todo-list-container">
            <h2>
              Action Items - {renderStageTitle(currentProject?.current_stage)}
            </h2>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (currentProject.todos?.filter((todo) => todo.completed)
                        .length /
                        (currentProject.todos?.length || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="progress-text">
                {currentProject.todos?.filter((todo) => todo.completed)
                  .length || 0}{" "}
                of {currentProject.todos?.length || 0} tasks completed
              </div>
            </div>

            <div className="todo-list">
              {currentProject.todos?.map((todoItem, index) => {
                const todoId = `${todoItem.task.substring(0, 20)}-${index}`;
                return (
                  <div key={todoId} className="todo-item" style={todoItemStyle}>
                    <label className="todo-label">
                      <input
                        type="checkbox"
                        checked={todoItem.completed}
                        onChange={(e) =>
                          handleTodoChange(todoItem.id, e.target.checked)
                        }
                        className="todo-checkbox"
                        // Stop propagation to prevent expanding when clicking the checkbox
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className={`todo-text ${
                          todoItem.completed ? "completed" : ""
                        } ${expandedTodos[todoId] ? "expanded" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleTodoExpansion(todoId);
                        }}
                      >
                        <span className="todo-number">{index + 1}.</span>{" "}
                        {todoItem.task}
                      </span>
                    </label>
                    <button
                      className="get-started-button"
                      onClick={() => handleGetStarted(todoItem)}
                    >
                      Get Started
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      {!isAuthChecked ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Checking authentication...</p>
        </div>
      ) : !currentProject ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading your projects...</p>
          {projects.length === 0 && (
            <p className="loading-message">
              No projects found. You will be redirected to create a new project.
            </p>
          )}
        </div>
      ) : (
        <div className="chat-container">
          <div className="messages-container" style={messagesContainerStyle}>
            {initialMessage && (
              <div className="message ai">
                <div className="message-content">{initialMessage}</div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.is_user ? "user" : "ai"}`}
              >
                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content">
                  <div className="typing-indicator" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSubmit}
            className="input-container"
            style={inputContainerStyle}
          >
            <div className="message-input-wrapper">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter response here.."
                className="message-input"
                disabled={isLoading}
                rows={1}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`send-button ${
                  inputMessage.trim() ? "visible" : ""
                }`}
              >
                <span className="arrow-up">↑</span>
              </button>
            </div>
            <div className="model-switch-container">
              <div className="model-switch">
                <label
                  className={`switch-option ${
                    selectedModel === "gpt-3.5-turbo" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value="gpt-3.5-turbo"
                    checked={selectedModel === "gpt-3.5-turbo"}
                    onChange={() => handleModelChange("gpt-3.5-turbo")}
                    disabled={isLoading}
                  />
                  3.5
                </label>
                <label
                  className={`switch-option ${
                    selectedModel === "gpt-4" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value="gpt-4"
                    checked={selectedModel === "gpt-4"}
                    onChange={() => handleModelChange("gpt-4")}
                    disabled={isLoading}
                  />
                  4
                </label>
              </div>
            </div>
          </form>

          {/* FAB Button */}
          <motion.button
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50px",
              color: "white",
              fontWeight: "500",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              zIndex: "100",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChatPopup}
          >
            <img src="/logo-white.png" alt="Mentar" width={24} height={24} />
            <span>Speak to Mentar</span>
          </motion.button>
        </div>
      )}

      {/* Chat Popup */}
      <div className={`chat-popup ${isChatPopupOpen ? "open" : ""}`}>
        <div className="chat-popup-header">
          <img src="/logo-black.png" alt="Mentar" />
          <button className="close-button" onClick={toggleChatPopup}>
            ×
          </button>
        </div>
        <div className="chat-popup-content">
          {popupMessages.length === 0 && (
            <div className="message bot">How can I help?</div>
          )}
          {popupMessages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? "user" : "bot"}`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
          {isPopupLoading && (
            <div className="message bot">
              <div className="typing-indicator" />
            </div>
          )}
          <div ref={popupMessagesEndRef} />
        </div>
        <form onSubmit={handlePopupSubmit} className="chat-popup-input">
          <div className="message-input-wrapper">
            <textarea
              ref={popupInputRef}
              value={popupMessage}
              onChange={handlePopupInputChange}
              onKeyDown={handlePopupKeyDown}
              placeholder="Enter chat here.."
              disabled={isPopupLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={isPopupLoading || !popupMessage.trim()}
              className={`send-button ${popupMessage.trim() ? "visible" : ""}`}
            >
              <span className="arrow-up">↑</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add the DeleteProjectDialog component */}
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        projectType={projectToDelete?.business_type || ""}
      />
    </div>
  );
}

export default AIChatInterface;
