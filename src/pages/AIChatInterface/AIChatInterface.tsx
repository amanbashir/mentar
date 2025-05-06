import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "../../lib/supabaseClient";
import { systemPrompt } from "../../../lib/mentars/systemPrompt";
import { buildPrompt } from "../../../lib/mentars/promptBuilder";
import { userProfile } from "../../../lib/mentars/userProfile";
import { saasStrategy } from "../../../lib/mentars/saasStrategy";
import { agencyStrategy } from "../../../lib/mentars/agencyStrategy";
import { ecomStrategy } from "../../../lib/mentars/ecomStrategy";
import { copywritingStrategy } from "../../../lib/mentars/copywritingStrategy";
import "./AIChatInterface.css";
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

const typedSaasStrategy = saasStrategy as BusinessStrategy;

// Helper functions
const extractBudget = (text: string): string | null => {
  const sentences = text
    .split(/[.!?]+/)
    .slice(0, 2)
    .join(". ");
  return sentences.trim();
};

const extractIncomeGoal = (text: string): string | null => {
  const incomeMatch = text.match(
    /(?:income|revenue|earnings|monthly goal).*?\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
  );
  return incomeMatch ? incomeMatch[1].replace(/,/g, "") : null;
};

const extractBusinessIdea = (text: string): string => {
  const sentences = text
    .split(/[.!?]+/)
    .slice(0, 2)
    .join(". ");
  return sentences.trim();
};

const calculateProgress = (
  completedStages: string[],
  tasksInProgress: string[]
): number => {
  const totalStages = Object.keys(typedSaasStrategy).length;
  const completedStageCount = completedStages.length;
  const stageProgress = (completedStageCount / totalStages) * 100;

  const totalTasks = Object.values(typedSaasStrategy).reduce((acc, stage) => {
    return acc + (stage.checklist?.length || 0);
  }, 0);
  const completedTaskCount = tasksInProgress.length;
  const taskProgress = (completedTaskCount / totalTasks) * 100;

  return Math.round((stageProgress + taskProgress) / 2);
};

// Get the appropriate strategy based on business type
const getStrategyForBusinessType = (businessType: string): BusinessStrategy => {
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

function AIChatInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
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

  useEffect(() => {
    // Handle new project from onboarding
    const newProject = location.state?.project;
    if (newProject) {
      setCurrentProject(newProject);
      fetchUserProjects();
      fetchProjectMessages(newProject.id);
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

      setInitialMessage(
        `Hi! I'm excited to help you build your ${currentProject?.business_type} business. Let's start with your budget - how much are you planning to invest in this business?`
      );

      if (messages) {
        setMessages(messages);
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

    // Use a more reliable approach for confirmation
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project and all its messages? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

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
        .eq("project_id", projectId);

      if (messagesError) {
        throw messagesError;
      }

      // Then, delete the project
      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (projectError) {
        throw projectError;
      }

      // Update local state
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      // If the deleted project was the current one, switch to the most recent project
      if (currentProject?.id === projectId) {
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
    } catch (error: any) {
      console.error("Error deleting project:", error);
      alert(`Failed to delete project: ${error.message}`);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
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

  // Add this function after the calculateProgress function
  const updateTodosInRealTime = async (projectId: string) => {
    try {
      const { data: updatedProject, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching updated project:", error);
        return;
      }

      if (updatedProject) {
        setCurrentProject(updatedProject);
        // Update todos based on the current stage
        const currentStage = updatedProject.current_stage as StageKey;
        if (typedSaasStrategy[currentStage]) {
          const stageData = typedSaasStrategy[currentStage];
          const newTodos =
            stageData.checklist?.map((task) => ({
              task,
              completed:
                updatedProject.tasks_in_progress?.includes(task) || false,
            })) || [];
          setTodos(newTodos);
        }
      }
    } catch (error) {
      console.error("Error updating todos in real-time:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      await saveMessage(userMessage, true);

      const businessTypeContext = `You are helping the user build a ${
        currentProject.business_type
      } business. 
      The user's budget is ${currentProject.total_budget || "not set yet"}. 
      The user's business idea is ${
        currentProject.business_idea || "not set yet"
      }.
      The user's income goal is ${currentProject.income_goal || "not set yet"}.
      Please provide specific, actionable responses and include any relevant numbers or goals mentioned by the user.`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
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
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      await saveMessage(aiResponse, false);

      // Extract values from messages
      const newBudget = extractBudget(userMessage) || extractBudget(aiResponse);
      const newIncomeGoal =
        extractIncomeGoal(userMessage) || extractIncomeGoal(aiResponse);
      const newBusinessIdea =
        extractBusinessIdea(userMessage) || extractBusinessIdea(aiResponse);

      // Only update values if new ones are found and different from current
      const updates: Partial<Project> = {
        brief_summary: aiResponse.split("\n")[0],
        business_overview_summary: aiResponse,
        business_type: currentProject.business_type,
        completed_stages: currentProject.completed_stages || [],
        current_stage: currentProject.current_stage || "stage_1",
        current_step:
          currentProject.current_step || saasStrategy.stage_1.checklist[0],
        expected_launch_date:
          currentProject.expected_launch_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        tasks_in_progress:
          currentProject.tasks_in_progress ||
          saasStrategy.stage_1.checklist.slice(0, 2),
        todos: currentProject.todos,
      };

      // Only update budget if a new valid budget is found
      if (newBudget) {
        const budgetNumber = parseFloat(newBudget.replace(/[^0-9.]/g, ""));
        if (!isNaN(budgetNumber)) {
          updates.total_budget = budgetNumber.toString();
        }
      }

      // Only update income goal if a new valid goal is found
      if (newIncomeGoal) {
        const incomeGoalNumber = parseFloat(newIncomeGoal);
        if (!isNaN(incomeGoalNumber)) {
          updates.income_goal = incomeGoalNumber;
        }
      }

      // Only update business idea if a new one is found
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

      // Update local state with new values
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));

      await updateTodosInRealTime(currentProject.id);

      // Generate and update business overview summary
      try {
        const summaryPrompt = `Summarize the current business for the user, including the business type, product/service, target audience, value proposition, and any other key details so far. Be concise and clear. Limit your summary to 2-3 sentences and no more than 60 words. Do not include any heading or label like 'Business Overview:' in your response.`;
        const contextMessages = [
          ...messages,
          { is_user: true, content: userMessage },
          { is_user: false, content: aiResponse },
        ]
          .slice(-10)
          .map((m) => ({
            role: m.is_user ? "user" : "assistant",
            content: m.content,
          }));

        const summaryResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                ...contextMessages,
                { role: "user", content: summaryPrompt },
              ],
              temperature: 0.5,
            }),
          }
        );

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;

          const { error: summaryUpdateError } = await supabase
            .from("projects")
            .update({ business_overview_summary: summary })
            .eq("id", currentProject.id);

          if (summaryUpdateError) {
            console.error(
              "Error updating business overview summary:",
              summaryUpdateError
            );
          }

          setCurrentProject((prev) =>
            prev ? { ...prev, business_overview_summary: summary } : prev
          );
        }
      } catch (err) {
        console.error("Error updating business overview summary:", err);
      }

      setInputMessage("");
      setIsLoading(false);
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

  const updateTodos = (moduleId: string, tasks: string[]) => {
    const newTodos = tasks.slice(0, 5).map((task, index) => ({
      id: `${moduleId}-${index}`,
      task,
      completed: false,
      module: moduleId,
    }));
    setTodos(newTodos);
  };

  // Add effect to log when projects or dropdown state changes
  useEffect(() => {
    console.log("Projects updated:", projects);
    console.log("Dropdown state:", showDropdown);
  }, [projects, showDropdown]);

  // Update the dropdown toggle handler
  const toggleDropdown = () => {
    console.log("Toggling dropdown. Current state:", !showDropdown);
    setShowDropdown(!showDropdown);
  };

  // Update the updateTodosForStage function
  const updateTodosForStage = async (stage: StageKey) => {
    if (!currentProject) return;

    const currentStrategy = getStrategyForBusinessType(
      currentProject.business_type
    );
    const stageData = currentStrategy[stage];
    let stageTodos: string[] = [];

    // Get business-type-specific todos
    switch (currentProject.business_type.toLowerCase()) {
      case "saas":
        stageTodos =
          stageData.checklist?.filter(
            (task) =>
              task.toLowerCase().includes("software") ||
              task.toLowerCase().includes("subscription") ||
              task.toLowerCase().includes("saas")
          ) || [];
        break;
      case "agency":
        stageTodos =
          stageData.checklist?.filter(
            (task) =>
              task.toLowerCase().includes("agency") ||
              task.toLowerCase().includes("client") ||
              task.toLowerCase().includes("service")
          ) || [];
        break;
      case "ecommerce":
        stageTodos =
          stageData.checklist?.filter(
            (task) =>
              task.toLowerCase().includes("product") ||
              task.toLowerCase().includes("inventory") ||
              task.toLowerCase().includes("shipping") ||
              task.toLowerCase().includes("ecommerce")
          ) || [];
        break;
      case "copywriting":
        stageTodos =
          stageData.checklist?.filter(
            (task) =>
              task.toLowerCase().includes("copy") ||
              task.toLowerCase().includes("content") ||
              task.toLowerCase().includes("writing")
          ) || [];
        break;
      default:
        stageTodos = stageData.checklist || [];
    }

    // Add common todos that apply to all business types
    const commonTodos =
      stageData.checklist?.filter(
        (task) =>
          !task.toLowerCase().includes("software") &&
          !task.toLowerCase().includes("subscription") &&
          !task.toLowerCase().includes("saas") &&
          !task.toLowerCase().includes("product") &&
          !task.toLowerCase().includes("inventory") &&
          !task.toLowerCase().includes("shipping") &&
          !task.toLowerCase().includes("ecommerce") &&
          !task.toLowerCase().includes("service") &&
          !task.toLowerCase().includes("client") &&
          !task.toLowerCase().includes("consultation") &&
          !task.toLowerCase().includes("platform") &&
          !task.toLowerCase().includes("vendor") &&
          !task.toLowerCase().includes("marketplace") &&
          !task.toLowerCase().includes("copy") &&
          !task.toLowerCase().includes("content") &&
          !task.toLowerCase().includes("writing")
      ) || [];

    // Combine business-specific and common todos
    const allTodos = [...new Set([...stageTodos, ...commonTodos])];

    const newTodos = allTodos.map((task) => ({
      task,
      completed: currentProject.tasks_in_progress?.includes(task) || false,
    }));

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          todos: newTodos,
          current_stage: stage,
        })
        .eq("id", currentProject.id);

      if (error) {
        console.error("Error updating todos for stage:", error);
        return;
      }

      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              todos: newTodos,
              current_stage: stage,
            }
          : null
      );
    } catch (error) {
      console.error("Error updating todos for stage:", error);
    }
  };

  // Add useEffect to handle stage changes
  useEffect(() => {
    if (currentProject?.current_stage) {
      const stage = currentProject.current_stage as StageKey;
      if (typedSaasStrategy[stage]) {
        updateTodosForStage(stage);
      }
    }
  }, [currentProject?.current_stage]);

  // Update the getProjectTodos function
  const getProjectTodos = (): TodoItem[] => {
    if (!currentProject) return [];

    // If we have todos in the database, use those
    if (currentProject.todos && currentProject.todos.length > 0) {
      return currentProject.todos;
    }

    // Otherwise, generate todos from the current stage
    const currentStage =
      (currentProject.current_stage as StageKey) || "stage_1";
    const currentStrategy = getStrategyForBusinessType(
      currentProject.business_type
    );
    const stageData = currentStrategy[currentStage];
    const todos: TodoItem[] = [];

    if (stageData.checklist) {
      stageData.checklist.forEach((task: string) => {
        todos.push({
          task,
          completed: currentProject.tasks_in_progress?.includes(task) || false,
        });
      });
    }

    // Update the todos in the database
    updateTodosForStage(currentStage);

    return todos;
  };

  // Update the handleTodoChange function
  const handleTodoChange = async (todoItem: TodoItem, isCompleted: boolean) => {
    if (!currentProject) return;

    try {
      // Update local state immediately for better UX
      const updatedTodos =
        currentProject.todos?.map((t) =>
          t.task === todoItem.task ? { ...t, completed: isCompleted } : t
        ) || [];

      // Update frontend state immediately
      setTodos(updatedTodos);
      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              todos: updatedTodos,
            }
          : null
      );

      // Get all completed tasks
      const completedTasks = updatedTodos
        .filter((t) => t.completed)
        .map((t) => t.task);

      // Update in database - only update existing fields
      const { error } = await supabase
        .from("projects")
        .update({
          todos: updatedTodos,
          tasks_in_progress: completedTasks,
        })
        .eq("id", currentProject.id);

      if (error) {
        console.error("Error updating todo in database:", error);
        // Revert local state if database update fails
        setTodos(currentProject.todos || []);
        setCurrentProject((prev) =>
          prev
            ? {
                ...prev,
                todos: currentProject.todos || [],
              }
            : null
        );
        throw error;
      }

      // Update the current project state
      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              tasks_in_progress: completedTasks,
            }
          : null
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      // Show error to user
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
      // Build the system prompt with business type context
      const businessTypeContext = `You are helping the user build a ${
        currentProject.business_type
      } business. 
      The user's budget is ${currentProject.total_budget || "not set yet"}. 
      The user's business idea is ${
        currentProject.business_idea || "not set yet"
      }.`;

      // Get AI response using the same endpoint as the main chat
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `${systemPrompt}\n\n${businessTypeContext}`,
              },
              ...popupMessages.map((msg) => ({
                role: msg.isUser ? "user" : "assistant",
                content: msg.content,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.7,
            presence_penalty: 0.6,
            frequency_penalty: 0.6,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      await saveMessage(aiResponse, false);

      // Update project data in Supabase based on AI response
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({
          brief_summary: aiResponse.split("\n")[0],
          business_idea: aiResponse.split("\n")[1],
          business_overview_summary: aiResponse,
          business_type: currentProject.business_type,
          completed_stages: currentProject.completed_stages || [],
          current_stage: currentProject.current_stage || "stage_1",
          current_step:
            currentProject.current_step || saasStrategy.stage_1.checklist[0],
          expected_launch_date:
            currentProject.expected_launch_date ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          income_goal: currentProject.income_goal || 0,
          tasks_in_progress:
            currentProject.tasks_in_progress ||
            saasStrategy.stage_1.checklist.slice(0, 2),
          total_budget: currentProject.total_budget || 0,
          progress: calculateProgress(
            currentProject.completed_stages || [],
            currentProject.tasks_in_progress || []
          ),
        })
        .eq("id", currentProject.id);

      if (projectUpdateError) {
        console.error("Error updating project:", projectUpdateError);
      }

      // Update todos in real-time after project update
      await updateTodosInRealTime(currentProject.id);

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
        const popupInput = document.querySelector(
          ".chat-popup-input input"
        ) as HTMLInputElement;
        if (popupInput) {
          popupInput.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="page-container">
      {/* Business Overview Panel */}
      {currentProject && (
        <div className="business-overview">
          <h2>Business Summary</h2>
          <div className="overview-content">
            {currentProject.business_overview_summary}
          </div>
        </div>
      )}

      {/* Logo Container */}
      <div className="logo-container">
        <div className="logo" onClick={toggleDropdown}>
          <img src="/logo-black.png" alt="Mentar Logo" />
        </div>
        {showDropdown && (
          <div ref={dropdownRef} className="dropdown-menu">
            {projects.length > 0 ? (
              <>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`dropdown-item ${
                      currentProject?.id === project.id ? "active" : ""
                    }`}
                    onClick={() => handleProjectSwitch(project)}
                  >
                    <div className="project-item">
                      <span className="project-name">
                        {project.business_type}
                      </span>
                      <button
                        className="delete-project"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <div className="dropdown-divider" />
              </>
            ) : (
              <div className="dropdown-item">No projects</div>
            )}
            <div
              className="dropdown-item new-project"
              onClick={handleNewProject}
            >
              New Project
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item" onClick={handleSettings}>
              Settings
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item" onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      {currentProject && (
        <div className="right-sidebar">
          {/* Todo List */}
          <div className="todo-list-container">
            <h2>
              Todo List -{" "}
              {currentProject?.current_stage?.replace("_", " ").toUpperCase()}
            </h2>
            <div className="todo-list">
              {getProjectTodos().map((todoItem, index) => (
                <div key={`${todoItem.task}-${index}`} className="todo-item">
                  <label className="todo-label">
                    <input
                      type="checkbox"
                      checked={todoItem.completed}
                      onChange={(e) =>
                        handleTodoChange(todoItem, e.target.checked)
                      }
                      className="todo-checkbox"
                    />
                    <span
                      className={`todo-text ${
                        todoItem.completed ? "completed" : ""
                      }`}
                    >
                      {todoItem.task}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Container */}
          <div className="budget-container">
            <h2>Budget</h2>
            <div className="budget-display">
              {currentProject?.total_budget
                ? `$${currentProject.total_budget}`
                : "No budget set"}
            </div>
          </div>

          {/* Progress Container */}
          <div className="progress-container">
            <h2>Progress</h2>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${calculateProgress(
                    currentProject?.completed_stages || [],
                    currentProject?.tasks_in_progress || []
                  )}%`,
                }}
              />
            </div>
            <div className="progress-text">
              {calculateProgress(
                currentProject?.completed_stages || [],
                currentProject?.tasks_in_progress || []
              )}
              % Complete
            </div>
          </div>

          {/* Goal Container */}
          <div className="goal-container">
            <h2>Business Idea</h2>
            <div className="goal-display">
              {currentProject?.business_idea
                ? `Your business idea: ${currentProject.business_idea}`
                : ""}
            </div>
          </div>

          {/* Launch Date Container */}
          <div className="launch-date-container">
            <h2>Expected Launch Date</h2>
            <div className="launch-date-display">
              {currentProject?.expected_launch_date
                ? new Date(
                    currentProject.expected_launch_date
                  ).toLocaleDateString()
                : "Launch date will be set based on your progress"}
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
          <div className="messages-container">
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
                  <ReactMarkdown>{message.content}</ReactMarkdown>
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
          <form onSubmit={handleSubmit} className="input-container">
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
        </div>
      )}

      {/* Chat Popup */}
      <button className="speak-to-mentar" onClick={toggleChatPopup}>
        Speak to Mentar
      </button>
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
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
          <input
            type="text"
            value={popupMessage}
            onChange={(e) => setPopupMessage(e.target.value)}
            placeholder="Enter chat here.."
            disabled={isPopupLoading}
          />
          <button
            type="submit"
            disabled={isPopupLoading || !popupMessage.trim()}
          >
            <span className="arrow-up">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatInterface;
