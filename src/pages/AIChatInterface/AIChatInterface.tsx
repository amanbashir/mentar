import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Components } from "react-markdown";
import { supabase } from "../../lib/supabaseClient";
import { systemPrompt, getCombinedPrompt } from "../../utils/prompts";
import "./AIChatInterface.css";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import { FaTrashCan } from "react-icons/fa6";
import { ecommerceBlueprint } from "../../../lib/mentars/ecom-new-strat";
import {
  extractBudget,
  extractIncomeGoal,
  extractBusinessIdea,
  generateInitialTodos,
  generateStageIntroduction,
  getStrategyForBusinessType,
  isStageCompleted,
  updateTodosForStage,
  generateBusinessOverviewSummary,
  getAIChatResponse,
  getNextStage,
  typedSaasStrategy,
  generateLaunchDateMessage,
} from "../../utils/openai";
import DeleteProjectDialog from "../../components/DeleteProjectDialog";

// Types
interface Project {
  id: string;
  user_id: string;
  business_type: string;
  created_at: string;
  is_deleted: boolean;
  selected_model: string | null;
  current_stage: string | null;
  current_step: string | null;
  completed_stages: string[];
  outputs: Record<string, any>;
  notes: Record<string, any>;
  tasks_in_progress: string[];
  business_idea: string | null;
  brief_summary: string | null;
  total_budget: string | null;
  expected_launch_date: string | null;
  income_goal: number | null;
  business_overview_summary: string | null;
  todos: TodoItem[];
}

interface TodoItem {
  task: string;
  completed: boolean;
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

// Interface for prequalification state
interface PrequalificationState {
  isPrequalifying: boolean;
  currentQuestionIndex: number;
  answers: string[];
  completed: boolean;
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

        // Check if we need to start prequalification
        if (
          currentProject?.business_type === "ecommerce" &&
          messages.length === 0 &&
          (!currentProject.outputs?.prequalification ||
            !currentProject.outputs.prequalification.completed)
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

  // Function to start prequalification process
  const startPrequalification = () => {
    if (!currentProject) return;

    setPrequalification({
      isPrequalifying: true,
      currentQuestionIndex: 0,
      answers: [],
      completed: false,
    });

    // Send first question as AI message with enhanced guidance
    if (ecommerceBlueprint.preQualification.questions.length > 0) {
      const firstQuestion = ecommerceBlueprint.preQualification.questions[0];
      const enhancedQuestion = enhancePrequalificationQuestion(
        firstQuestion,
        0
      );
      saveMessage(
        `Welcome to your ecommerce business journey! To help me provide the best guidance for you, I'd like to ask a few important questions:\n\n${enhancedQuestion}`,
        false
      );
    }
  };

  // Add context and examples to prequalification questions
  const enhancePrequalificationQuestion = (
    question: string,
    index: number
  ): string => {
    const enhancedQuestions = [
      `${question}\n\nFor example, you might say "$500-1000," "$5,000," or "around $10,000 initially."`,
      `${question}\n\nFor example, "10 hours per week," "3-4 hours daily," or "only weekends."`,
      `${question}\n\nFor example, "I've never sold online before," "I have a Shopify store but no success yet," or "I've been selling on eBay for 2 years."`,
      `${question}\n\nOn a scale of 1-10, how would you rate your comfort with these tools? Or you can describe your experience more specifically.`,
      `${question}\n\nFor example, "I'm good at design," "I enjoy analyzing data," or "I'm strong at organization and planning."`,
      `${question}\n\nPlease be honest about your risk tolerance and financial readiness for testing different ad strategies.`,
    ];

    return index < enhancedQuestions.length
      ? enhancedQuestions[index]
      : question;
  };

  // Handle next prequalification question
  const handleNextPrequalificationQuestion = async (userAnswer: string) => {
    if (!currentProject || !prequalification.isPrequalifying) return;

    // Save user's answer
    const newAnswers = [...prequalification.answers, userAnswer];
    const nextQuestionIndex = prequalification.currentQuestionIndex + 1;

    // Check if we've reached the end of questions
    if (
      nextQuestionIndex >= ecommerceBlueprint.preQualification.questions.length
    ) {
      // All questions answered, complete prequalification
      setPrequalification({
        isPrequalifying: false,
        currentQuestionIndex: nextQuestionIndex,
        answers: newAnswers,
        completed: true,
      });

      // Save prequalification answers to project metadata
      const prequalificationData = {
        questions: ecommerceBlueprint.preQualification.questions,
        answers: newAnswers,
        completedAt: new Date().toISOString(),
      };

      // Create outputs object if it doesn't exist
      const updatedOutputs = {
        ...(currentProject.outputs || {}),
        prequalification: prequalificationData,
      };

      // Update project with prequalification data
      const { error } = await supabase
        .from("projects")
        .update({
          outputs: updatedOutputs,
        })
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
        const summary = generatePrequalificationSummary(newAnswers);
        await saveMessage(summary, false);
      }
    } else {
      // Send next question with enhanced guidance
      const nextQuestion =
        ecommerceBlueprint.preQualification.questions[nextQuestionIndex];
      const enhancedQuestion = enhancePrequalificationQuestion(
        nextQuestion,
        nextQuestionIndex
      );
      await saveMessage(enhancedQuestion, false);

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
  const generatePrequalificationSummary = (answers: string[]): string => {
    // Evaluate the prequalification answers
    const evaluation = evaluatePrequalificationAnswers(answers);

    // Find the launch date answer if available
    const questions = ecommerceBlueprint.preQualification.questions;
    const launchDateQuestionIndex = questions.findIndex(
      (q: string) => q.includes("launch") || q.includes("When do you wish")
    );

    let launchDateInfo = "";
    if (launchDateQuestionIndex !== -1 && answers[launchDateQuestionIndex]) {
      launchDateInfo = `\n7. Your target launch timeframe: ${answers[launchDateQuestionIndex]}`;
    }

    return `Thank you for sharing this information! Based on what you've told me:

1. Your investment capital: ${answers[0]}
2. Your weekly time commitment: ${answers[1]}
3. Your experience level: ${answers[2]}
4. Your comfort with digital tools: ${answers[3]}
5. Your strengths: ${answers[4]}
6. Your willingness to invest in ads: ${answers[5]}${launchDateInfo}

${evaluation}

I'll use this information to guide you through your ecommerce journey. Let's get started with building your business plan!`;
  };

  // Function to evaluate the prequalification answers and provide recommendations
  const evaluatePrequalificationAnswers = (answers: string[]): string => {
    let recommendations = "";

    // Simple evaluation logic - can be expanded with more sophisticated analysis
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

    // Build recommendations based on answers
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

    return (
      recommendations ||
      "Your profile shows good alignment with ecommerce business needs. Let's focus on leveraging your strengths while developing areas where you might need more support."
    );
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      await saveMessage(userMessage, true);

      // Check if we're in prequalification mode
      if (prequalification.isPrequalifying) {
        await handleNextPrequalificationQuestion(userMessage);
        setIsLoading(false);
        return;
      }

      // Determine if this is a task from the todo list
      const isTodoTask = currentProject.todos?.some(
        (todo: TodoItem) => todo.task === userMessage
      );

      // Only generate todos if the project has no todos yet (initial setup)
      if (!currentProject.todos || currentProject.todos.length === 0) {
        if (!currentProject.total_budget) {
          const budget = extractBudget(userMessage);
          if (!budget) {
            throw new Error("Could not extract budget from message");
          }

          // Update project with budget
          const { error: budgetUpdateError } = await supabase
            .from("projects")
            .update({ total_budget: budget })
            .eq("id", currentProject.id);

          if (budgetUpdateError) throw budgetUpdateError;

          // Update local state
          setCurrentProject((prev) =>
            prev
              ? {
                  ...prev,
                  total_budget: budget,
                }
              : null
          );

          // Ask for income goal
          const incomeGoalMessage = `Great! With a budget of ${budget}, what's your target monthly income goal for this ${currentProject.business_type} business?`;
          await saveMessage(incomeGoalMessage, false);
          setIsLoading(false);
          return;
        } else if (!currentProject.income_goal) {
          const incomeGoal = extractIncomeGoal(userMessage);
          if (!incomeGoal) {
            // Instead of throwing an error, provide a helpful response
            const helpMessage =
              "I couldn't identify your monthly income goal from your message. Please specify it in a format like: 'My income goal is $5,000 per month' or 'I want to earn $2,500 monthly.'";
            await saveMessage(helpMessage, false);
            setIsLoading(false);
            return;
          }

          const incomeGoalNumber = parseFloat(incomeGoal);
          if (isNaN(incomeGoalNumber)) {
            // Instead of throwing an error for invalid number, provide a helpful response
            const helpMessage =
              "I couldn't convert your income goal to a valid number. Please specify a clear amount, for example: 'My income goal is $5,000 per month.'";
            await saveMessage(helpMessage, false);
            setIsLoading(false);
            return;
          }

          // Update project with income goal
          const { error: incomeGoalUpdateError } = await supabase
            .from("projects")
            .update({ income_goal: incomeGoalNumber })
            .eq("id", currentProject.id);

          if (incomeGoalUpdateError) throw incomeGoalUpdateError;

          // Update local state
          setCurrentProject((prev) =>
            prev
              ? {
                  ...prev,
                  income_goal: incomeGoalNumber,
                }
              : null
          );

          // Show todo generation loading overlay
          setIsGeneratingTodos(true);

          // Generate initial todos
          const generatedTodos = await generateInitialTodos(
            currentProject.id,
            currentProject.total_budget,
            currentProject.business_type
          );

          // Update project with todos
          const { error: todosUpdateError } = await supabase
            .from("projects")
            .update({
              todos: generatedTodos,
              tasks_in_progress: [],
              current_stage: "stage_1",
            })
            .eq("id", currentProject.id);

          if (todosUpdateError) throw todosUpdateError;

          // Fetch the updated project to get the expected_launch_date if it was set
          const { data: updatedProject, error: fetchUpdateError } =
            await supabase
              .from("projects")
              .select("*")
              .eq("id", currentProject.id)
              .single();

          if (fetchUpdateError) throw fetchUpdateError;

          // Update local state
          setCurrentProject((prev) =>
            prev
              ? {
                  ...prev,
                  todos: generatedTodos,
                  tasks_in_progress: [],
                  current_stage: "stage_1",
                  expected_launch_date: updatedProject.expected_launch_date,
                }
              : null
          );

          // Hide todo generation loading overlay
          setIsGeneratingTodos(false);

          // Get the current strategy for detailed stage information
          const currentStrategy = getStrategyForBusinessType(
            currentProject.business_type
          );

          // Generate detailed stage introduction
          let aiResponse = generateStageIntroduction(
            currentProject.business_type,
            "stage_1",
            currentStrategy,
            currentProject.total_budget
          );

          // Add launch date message if available
          if (updatedProject.expected_launch_date) {
            // Get launch date message first since it's now async
            const launchDateMessage = await generateLaunchDateMessage(
              updatedProject.expected_launch_date,
              currentProject.id
            );

            // Then prepend it to the aiResponse if we got one
            if (launchDateMessage) {
              aiResponse = launchDateMessage + "\n\n" + aiResponse;
            }
          }

          await saveMessage(aiResponse, false);
          setIsLoading(false);
          return;
        }
      }

      // If the message is a todo item, add a specific prompt to help with task completion
      let enhancedUserMessage = userMessage;
      if (isTodoTask) {
        const matchingTodo = currentProject.todos?.find(
          (todo: TodoItem) => todo.task === userMessage
        );
        if (matchingTodo) {
          // Mark this as a request for completed work, not just guidance
          enhancedUserMessage = `Complete this task for me: "${userMessage}". Don't tell me how to do it - instead, provide the actual finished work, content, or solution I need. Give me something I can use immediately without further work on my part.`;
        }
      }

      // Prepare prequalification context if available
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

      // Continue with normal AI response for subsequent messages
      // Use the getAIChatResponse utility function instead of implementing the API call here
      const aiResponse = await getAIChatResponse(
        messages,
        enhancedUserMessage + prequalificationContext, // Add prequalification context
        currentProject,
        getCombinedPrompt(currentProject.business_type)
      );

      await saveMessage(aiResponse, false);

      // Generate a proper business overview summary using the utility function
      const businessOverview = await generateBusinessOverviewSummary(
        currentProject,
        messages
      );

      // Only update the business overview and summary, not the todos or tasks
      const updates: Partial<Project> = {
        brief_summary: businessOverview,
        business_overview_summary: businessOverview,
      };

      const newIncomeGoal =
        extractIncomeGoal(userMessage) || extractIncomeGoal(aiResponse);
      const newBusinessIdea =
        extractBusinessIdea(userMessage) || extractBusinessIdea(aiResponse);

      if (newIncomeGoal) {
        const incomeGoalNumber = parseFloat(newIncomeGoal);
        if (!isNaN(incomeGoalNumber)) {
          updates.income_goal = incomeGoalNumber;
        }
      }

      if (newBusinessIdea) {
        updates.business_idea = newBusinessIdea;
      }

      // Update project in database
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", currentProject.id);

      if (projectUpdateError) {
        console.error("Error updating project:", projectUpdateError);
      }

      // Update local state
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      // Hide todo generation loading overlay in case of error
      setIsGeneratingTodos(false);
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

  // Helper function to get next stage
  const getNextStage = (currentStage: StageKey): StageKey | null => {
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

  const handleGoalEdit = async (newGoal: string) => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({ business_idea: newGoal })
        .eq("id", currentProject.id);

      if (error) throw error;

      setCurrentProject({ ...currentProject, business_idea: newGoal });
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error updating business idea:", error);
    }
  };

  const handleBudgetEdit = async (newBudget: string) => {
    if (!currentProject) return;
    try {
      const budgetNumber = parseFloat(newBudget);
      if (isNaN(budgetNumber)) {
        throw new Error("Invalid budget amount");
      }

      const { error } = await supabase
        .from("projects")
        .update({ total_budget: budgetNumber })
        .eq("id", currentProject.id);

      if (error) throw error;

      setCurrentProject({
        ...currentProject,
        total_budget: budgetNumber.toString(),
      });
      setIsEditingBudget(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleLaunchDateEdit = async (newDate: string) => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({ expected_launch_date: newDate })
        .eq("id", currentProject.id);

      if (error) throw error;

      setCurrentProject({ ...currentProject, expected_launch_date: newDate });
      setIsEditingLaunchDate(false);
    } catch (error) {
      console.error("Error updating launch date:", error);
    }
  };

  const handleTodoChange = async (todoItem: TodoItem, isCompleted: boolean) => {
    if (!currentProject) return;

    try {
      // Create updated todos array
      const updatedTodos =
        currentProject.todos?.map((t) =>
          t.task === todoItem.task ? { ...t, completed: isCompleted } : t
        ) || [];

      // Get all completed tasks
      const completedTasks = updatedTodos
        .filter((t) => t.completed)
        .map((t) => t.task);

      // Update in database first
      const { error } = await supabase
        .from("projects")
        .update({
          todos: updatedTodos,
          tasks_in_progress: completedTasks,
        })
        .eq("id", currentProject.id);

      if (error) {
        console.error("Error updating todo in database:", error);
        throw error;
      }

      // Only update local state after successful database update
      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              todos: updatedTodos,
              tasks_in_progress: completedTasks,
            }
          : null
      );

      // Check if all tasks in the current stage are completed
      const currentStrategy = getStrategyForBusinessType(
        currentProject.business_type
      );
      const currentStage = currentProject.current_stage as StageKey;
      const stageCompleted = isStageCompleted(
        completedTasks,
        currentStage,
        currentStrategy,
        currentProject.todos
      );

      if (stageCompleted) {
        // Get next stage
        const nextStage = getNextStage(currentStage);
        if (nextStage) {
          // Generate new todos for the next stage
          await updateTodosForStage(nextStage, currentProject);

          // Add a message to inform the user about stage completion
          const stageCompletionMessage = `Congratulations! You've completed all tasks for ${currentStage
            .replace("_", " ")
            .toUpperCase()}. Moving on to ${nextStage
            .replace("_", " ")
            .toUpperCase()}...`;
          await saveMessage(stageCompletionMessage, false);
        }
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      alert("Failed to update todo. Please try again.");
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

      const aiResponse = await getAIChatResponse(
        formattedMessages,
        userMessage + prequalificationContext,
        currentProject,
        getCombinedPrompt(currentProject.business_type)
      );

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
      const match = /language-(\w+)/.exec(className || "");
      const language = match && match[1] ? match[1] : "";

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

  return (
    <div className="page-container">
      <Navbar />

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
              Action Items -{" "}
              {currentProject?.current_stage?.replace("_", " ").toUpperCase()}
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
                          handleTodoChange(todoItem, e.target.checked)
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
                        {todoItem.task}
                      </span>
                    </label>
                    <button
                      className="get-started-button"
                      onClick={() => {
                        setInputMessage(
                          todoItem.task + "\n\nHelp me complete this task"
                        );
                        if (inputRef.current) {
                          inputRef.current.focus();
                          setTimeout(() => {
                            adjustTextareaHeight();
                          }, 0);
                        }
                      }}
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
              className="send-button"
            >
              <span className="arrow-up">↑</span>
            </button>
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
          >
            <span className="arrow-up">↑</span>
          </button>
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
