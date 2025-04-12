import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import './AIChatInterface.css';
import { systemPrompt } from '../../../lib/mentars/systemPrompt';
import { buildPrompt, UserData, updateProjectOutputs, updateProjectNotes, markStageCompleted, updateCurrentStep } from '../../../lib/mentars/promptBuilder';

interface BusinessOverview {
  setup: string;
  financials: string;
  timeline: string;
  earnings: string;
  dreams: string;
  alignment: string;
  readiness: string;
}

interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  module: string;
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

// Add interface for module tasks
interface ModuleTask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface Project {
  id: string;
  user_id: string;
  name: string;
  project_name: string;
  selected_model: string;
  current_stage: string;
  current_step: string;
  budget: number;
  goal: string;
  launch_date: string;
  progress: number;
  outputs: Record<string, any>;
  notes: Record<string, any>;
  tasks_in_progress: string[];
  completed_stages: string[];
  created_at: string;
  updated_at: string;
}

// Add type for required fields
type RequiredFields = {
  budget: string;
  time: string;
  experience: string;
  goal_income: string;
};

const AIChatInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [businessOverview, setBusinessOverview] = useState<BusinessOverview>({
    setup: '',
    financials: '',
    timeline: '',
    earnings: '',
    dreams: '',
    alignment: '',
    readiness: ''
  });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [tempBudget, setTempBudget] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const popupMessagesEndRef = useRef<HTMLDivElement>(null);
  const [popupMessages, setPopupMessages] = useState<PopupMessage[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [moduleTasks, setModuleTasks] = useState<ModuleTask[]>([]);
  const [isEditingLaunchDate, setIsEditingLaunchDate] = useState(false);
  const [tempLaunchDate, setTempLaunchDate] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showProjectSummary, setShowProjectSummary] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollectingUserData, setIsCollectingUserData] = useState(false);
  const [currentDataPrompt, setCurrentDataPrompt] = useState<string | null>(null);
  const [pendingDataFields, setPendingDataFields] = useState<string[]>([]);

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsInitializing(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        await fetchUserProjects();
        setIsAuthChecked(true);
      } catch (err) {
        console.error('Error initializing component:', err);
        setError('Failed to initialize the application. Please try refreshing the page.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeComponent();
  }, []);

  // Handle business type from onboarding
  useEffect(() => {
    const businessTypeFromState = location.state?.businessType;
    
    const initializeBusinessType = async () => {
      if (businessTypeFromState) {
        setBusinessType(businessTypeFromState);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData } = await supabase
            .from('userData')
            .select('first_name')
            .eq('user_id', session.user.id)
            .single();
          
          const businessTypeLower = businessTypeFromState.toLowerCase();
          
          if (businessTypeLower === 'ecommerce' || 
              businessTypeLower === 'agency' || 
              businessTypeLower === 'software' ||
              businessTypeLower === 'copywriting') {
            setInitialMessage(`Hi ${userData?.first_name || ''}, great choice! Let's confirm if this is a good fit for you and your goals.

To help me understand your starting point, please enter your current budget for this business. This is the amount you can invest upfront (e.g., $1000, $5000, etc.).`);
          } else {
            setInitialMessage(`Hello ${userData?.first_name || ''}, you've chosen ${businessTypeFromState}. Let's begin your journey to success.

What's your main goal with this business? This will help me provide the most relevant guidance for your specific needs.`);
          }
        }
        fetchUserProjects();
      } else {
        checkUserBusinessType();
      }
    };

    initializeBusinessType();
  }, [location.state]);

  // Handle new project from onboarding
  useEffect(() => {
    const newProject = location.state?.project;
    if (newProject) {
      setCurrentProject(newProject);
      fetchUserProjects();
      fetchProjectMessages(newProject.id);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load messages when current project changes
  useEffect(() => {
    if (currentProject) {
      fetchProjectMessages(currentProject.id);
    }
  }, [currentProject?.id]);

  // Handle clicking outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check user data on mount
  useEffect(() => {
    checkAndCollectUserData();
  }, []);

  // Fetch module tasks when current project changes
  useEffect(() => {
    if (currentProject) {
      fetchModuleTasks();
    }
  }, [currentProject]);

  const checkUserBusinessType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('userData')
        .select('business_type, first_name')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (userData?.business_type) {
        setBusinessType(userData.business_type);
        const businessTypeLower = userData.business_type.toLowerCase();
        
        // Map business types to their proper names
        const businessTypeMap: Record<string, string> = {
          'ecommerce': 'ecommerce',
          'agency': 'agency',
          'software': 'software',
          'copywriting': 'copywriting'
        };
        
        const properBusinessType = businessTypeMap[businessTypeLower] || userData.business_type;
        
        if (properBusinessType) {
          setInitialMessage(`Hi ${userData.first_name || ''}, great choice! Let's confirm if this is a good fit for you and your goals.

To help me understand your starting point, please enter your current budget for your ${properBusinessType} business. This is the amount you can invest upfront (e.g., $1000, $5000, etc.).`);
        } else {
          setInitialMessage(`Hello ${userData.first_name || ''}, you've chosen ${userData.business_type}. Let's begin your journey to success.

What's your main goal with this business? This will help me provide the most relevant guidance for your specific needs.`);
        }
      } else {
        setInitialMessage("My name is Mentar. I'm here to help you start your online business. Do you already know what kind of business you want to start?");
      }
    } catch (error) {
      console.error('Error:', error);
      setInitialMessage("My name is Mentar. I'm here to help you start your online business. Do you already know what kind of business you want to start?");
    }
  };

  const fetchUserProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching projects for user:', session.user.id);
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to fetch projects. Please try again.');
        return;
      }

      console.log('Projects fetched:', projects);
      if (projects && Array.isArray(projects) && projects.length > 0) {
        console.log('Found', projects.length, 'projects');
        setProjects(projects);
        
        // Only set current project if none is selected or current one not found
        if (!currentProject || !projects.find(p => p.id === currentProject.id)) {
          console.log('Setting current project to:', projects[0]);
          setCurrentProject(projects[0]);
        }
      } else {
        console.log('No projects found');
        setProjects([]);
        setCurrentProject(null);
        
        // Only redirect if not already on onboarding
        if (location.pathname !== '/onboarding') {
          console.log('Redirecting to onboarding');
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProjects:', error);
      setError('Failed to fetch projects. Please try again.');
      setProjects([]);
      setCurrentProject(null);
    }
  };

  const fetchProjectMessages = async (projectId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (messages) {
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const saveMessage = async (content: string, isUser: boolean) => {
    if (!currentProject) return;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            project_id: currentProject.id,
            content,
            is_user: isUser,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (message) {
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleProjectSwitch = async (project: Project) => {
    try {
      setCurrentProject(project);
      setShowDropdown(false);
      
      // Fetch user data for the project
      await fetchUserData(project.user_id);
      
      // Fetch module tasks for the project
      await fetchModuleTasks();
      
      // Clear messages when switching projects
      setMessages([]);
      
      // Set initial message based on project stage
      if (project.current_stage === 'setup') {
        setInitialMessage(`Welcome to your ${project.selected_model} project! Let's get started by setting up your business.`);
      } else {
        setInitialMessage(`Welcome back to your ${project.selected_model} project! You're currently in the ${project.current_stage} stage.`);
      }
    } catch (error) {
      console.error('Error switching projects:', error);
    }
  };

  const handleNewProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const newProject = {
        user_id: session.user.id,
        name: '',
        project_name: '',
        selected_model: 'ecommerce',
        current_stage: 'setup',
        current_step: 'initial',
        completed_stages: [],
        outputs: {},
        notes: {},
        tasks_in_progress: [],
        budget: 0,
        goal: '',
        launch_date: '',
        progress: 0
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects([data, ...projects]);
        setCurrentProject(data);
      }

      setShowDropdown(false);
    } catch (error) {
      console.error('Error creating new project:', error);
    }
  };

  const handleSettings = () => {
    // Implement settings handling
    console.log('Settings option clicked');
  };

  // Function to extract and save tasks from AI response
  const extractAndSaveTasks = async (aiResponse: string) => {
    if (!currentProject) return;

    try {
      // Look for task lists in the AI response
      const taskRegex = /(?:^\d+\.\s+|\n\d+\.\s+)(.*?)(?=\n\d+\.|$)/gm;
      const matches = aiResponse.matchAll(taskRegex);
      const tasks = Array.from(matches, m => m[1]?.trim()).filter(Boolean);

      if (tasks.length > 0) {
        // Get current tasks count to determine order
        const { data: existingTasks, error: countError } = await supabase
          .from('module_tasks')
          .select('id')
          .eq('project_id', currentProject.id);

        if (countError) {
          console.error('Error checking existing tasks:', countError);
          return;
        }

        const startOrder = (existingTasks?.length || 0) + 1;

        // Create new tasks
        const tasksToInsert = tasks.map((title, index) => ({
          project_id: currentProject.id,
          title,
          completed: false,
          order: startOrder + index
        }));

        const { error } = await supabase
          .from('module_tasks')
          .insert(tasksToInsert);

        if (error) {
          console.error('Error saving tasks:', error);
          return;
        }

        console.log('New tasks saved:', tasksToInsert);
        fetchModuleTasks();
      }
    } catch (error) {
      console.error('Error in extractAndSaveTasks:', error);
    }
  };

  // Function to extract business overview from AI responses
  const extractBusinessOverview = (aiResponse: string) => {
    if (!currentProject) return;

    // Look for setup information
    const setupRegex = /(?:setup|start|begin|launch|establish) (.*?)(?:\.|\n|$)/i;
    const setupMatch = aiResponse.match(setupRegex);
    if (setupMatch && !businessOverview.setup) {
      updateBusinessOverview('setup', setupMatch[1].trim());
    }

    // Look for financial information
    const financialsRegex = /(?:financial|budget|cost|investment|spending) (.*?)(?:\.|\n|$)/i;
    const financialsMatch = aiResponse.match(financialsRegex);
    if (financialsMatch && !businessOverview.financials) {
      updateBusinessOverview('financials', financialsMatch[1].trim());
    }

    // Look for timeline information
    const timelineRegex = /(?:timeline|schedule|plan|deadline|milestone) (.*?)(?:\.|\n|$)/i;
    const timelineMatch = aiResponse.match(timelineRegex);
    if (timelineMatch && !businessOverview.timeline) {
      updateBusinessOverview('timeline', timelineMatch[1].trim());
    }

    // Look for earnings information
    const earningsRegex = /(?:earnings|revenue|income|profit|sales) (.*?)(?:\.|\n|$)/i;
    const earningsMatch = aiResponse.match(earningsRegex);
    if (earningsMatch && !businessOverview.earnings) {
      updateBusinessOverview('earnings', earningsMatch[1].trim());
    }

    // Look for dreams/goals information
    const dreamsRegex = /(?:dream|goal|vision|aspiration|ambition) (.*?)(?:\.|\n|$)/i;
    const dreamsMatch = aiResponse.match(dreamsRegex);
    if (dreamsMatch && !businessOverview.dreams) {
      updateBusinessOverview('dreams', dreamsMatch[1].trim());
    }

    // Look for alignment information
    const alignmentRegex = /(?:alignment|fit|match|compatibility|suitability) (.*?)(?:\.|\n|$)/i;
    const alignmentMatch = aiResponse.match(alignmentRegex);
    if (alignmentMatch && !businessOverview.alignment) {
      updateBusinessOverview('alignment', alignmentMatch[1].trim());
    }

    // Look for readiness information
    const readinessRegex = /(?:readiness|preparedness|capability|ability|skill) (.*?)(?:\.|\n|$)/i;
    const readinessMatch = aiResponse.match(readinessRegex);
    if (readinessMatch && !businessOverview.readiness) {
      updateBusinessOverview('readiness', readinessMatch[1].trim());
    }
  };

  // Function to extract budget and goal from AI responses
  const extractBudgetAndGoal = (aiResponse: string) => {
    if (!currentProject) return;

    // Look for budget mentions (e.g., "$1000", "1000 dollars", etc.)
    const budgetRegex = /\$\d+(?:,\d{3})*|\d+\s*(?:dollars?|USD)/gi;
    const budgetMatch = aiResponse.match(budgetRegex);
    
    if (budgetMatch) {
      const budget = budgetMatch[0].replace(/\s*dollars?|USD/i, '');
      handleBudgetEdit(budget);
    }

    // Look for goal-related content after specific phrases
    const goalRegex = /(?:your goal is|main goal is|goal to|aiming to|want to) (.*?)(?:\.|\n|$)/i;
    const goalMatch = aiResponse.match(goalRegex);
    
    if (goalMatch) {
      const goal = goalMatch[1].trim();
      handleGoalEdit(goal);
    }

    // Look for launch date mentions
    const launchDateRegex = /(?:launch date|release date|go live|start date) (?:is|will be|set to|scheduled for) (.*?)(?:\.|\n|$)/i;
    const launchDateMatch = aiResponse.match(launchDateRegex);
    
    if (launchDateMatch) {
      const dateStr = launchDateMatch[1].trim();
      // Try to parse the date string
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        handleLaunchDateEdit(parsedDate.toISOString().split('T')[0]);
      }
    }

    // Ensure the response is business type-specific
    if (currentProject.selected_model === 'ecommerce' && 
        (aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('software') || 
         aiResponse.toLowerCase().includes('agency'))) {
      // If the response mentions other business types for an ecommerce business, trigger a correction
      const correctedResponse = aiResponse
        .replace(/copywriting business|software business|agency business/g, 'ecommerce business')
        .replace(/copywriter|software founder|agency owner/g, 'online store owner');
      return correctedResponse;
    }
    
    if (currentProject.selected_model === 'copywriting' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('software') || 
         aiResponse.toLowerCase().includes('agency'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|software business|agency business/g, 'copywriting business')
        .replace(/online store owner|software founder|agency owner/g, 'copywriter');
      return correctedResponse;
    }
    
    if (currentProject.selected_model === 'agency' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('software'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|copywriting business|software business/g, 'agency business')
        .replace(/online store owner|copywriter|software founder/g, 'agency owner');
      return correctedResponse;
    }
    
    if (currentProject.selected_model === 'software' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('agency'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|copywriting business|agency business/g, 'software business')
        .replace(/online store owner|copywriter|agency owner/g, 'software founder');
      return correctedResponse;
    }
  };

  // Update the handleSubmit function to use the new prompt builder and save outputs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await saveMessage(userMessage, true);

      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Build the prompt using the new function
      const prompt = await buildPrompt(session.user.id, currentProject.id);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: prompt
            },
            ...messages.map(msg => ({
              role: msg.is_user ? "user" : "assistant",
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      await saveMessage(aiResponse, false);
      await extractAndSaveTasks(aiResponse);
      
      // Extract and save outputs from the AI response
      await extractAndSaveOutputs(aiResponse);
      
      // Extract and save notes from the AI response
      await extractAndSaveNotes(aiResponse);
    } catch (error) {
      console.error('Error in chat:', error);
      await saveMessage("I apologize, but I encountered an error. Please try again.", false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to extract and save outputs from AI response
  const extractAndSaveOutputs = async (aiResponse: string) => {
    if (!currentProject) return;

    try {
      // Get the current outputs
      const currentOutputs = currentProject.outputs || {};
      
      // Extract outputs based on the current step
      const step = currentProject.current_step;
      
      // Look for specific patterns in the AI response that indicate outputs
      // This is a simplified example - you would need to customize this based on your specific needs
      if (step === 'budget' && !currentOutputs.budget) {
        const budgetRegex = /\$\d+(?:,\d{3})*|\d+\s*(?:dollars?|USD)/gi;
        const budgetMatch = aiResponse.match(budgetRegex);
        if (budgetMatch) {
          currentOutputs.budget = budgetMatch[0].replace(/\s*dollars?|USD/i, '');
        }
      } else if (step === 'goalIncome' && !currentOutputs.goalIncome) {
        const goalRegex = /\$\d+(?:,\d{3})*|\d+\s*(?:dollars?|USD) per month/gi;
        const goalMatch = aiResponse.match(goalRegex);
        if (goalMatch) {
          currentOutputs.goalIncome = goalMatch[0].replace(/\s*dollars?|USD per month/i, '');
        }
      } else if (step === 'businessReason' && !currentOutputs.businessReason) {
        const reasonRegex = /(?:because|reason|chose|selected|interested in) (.*?)(?:\.|\n|$)/i;
        const reasonMatch = aiResponse.match(reasonRegex);
        if (reasonMatch) {
          currentOutputs.businessReason = reasonMatch[1].trim();
        }
      }
      
      // If we have new outputs, update the project
      if (Object.keys(currentOutputs).length > 0) {
        await updateProjectOutputs(currentProject.id, currentOutputs);
        
        // Update the local state
        setCurrentProject({
          ...currentProject,
          outputs: currentOutputs
        });
      }
    } catch (error) {
      console.error('Error in extractAndSaveOutputs:', error);
    }
  };

  // Function to extract and save notes from AI response
  const extractAndSaveNotes = async (aiResponse: string) => {
    if (!currentProject) return;

    try {
      // Get the current notes
      const currentNotes = currentProject.notes || {};
      
      // Extract notes based on the current step
      const step = currentProject.current_step;
      
      // Look for specific patterns in the AI response that indicate notes
      // This is a simplified example - you would need to customize this based on your specific needs
      if (step === 'budget' && !currentNotes.budgetReasoning) {
        const reasoningRegex = /(?:because|reason|consider|think|believe) (.*?)(?:\.|\n|$)/i;
        const reasoningMatch = aiResponse.match(reasoningRegex);
        if (reasoningMatch) {
          currentNotes.budgetReasoning = reasoningMatch[1].trim();
        }
      } else if (step === 'goalIncome' && !currentNotes.goalReasoning) {
        const reasoningRegex = /(?:because|reason|consider|think|believe) (.*?)(?:\.|\n|$)/i;
        const reasoningMatch = aiResponse.match(reasoningRegex);
        if (reasoningMatch) {
          currentNotes.goalReasoning = reasoningMatch[1].trim();
        }
      }
      
      // If we have new notes, update the project
      if (Object.keys(currentNotes).length > 0) {
        await updateProjectNotes(currentProject.id, currentNotes);
        
        // Update the local state
        setCurrentProject({
          ...currentProject,
          notes: currentNotes
        });
      }
    } catch (error) {
      console.error('Error in extractAndSaveNotes:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project switching when clicking delete
    
    // Use a more reliable approach for confirmation
    const confirmDelete = window.confirm('Are you sure you want to delete this project and all its messages? This action cannot be undone.');
    
    if (!confirmDelete) {
      return;
    }

    try {
      // Get the current user to verify ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, delete all messages for this project
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('project_id', projectId);

      if (messagesError) {
        throw messagesError;
      }

      // Then, delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (projectError) {
        throw projectError;
      }

      // Update local state
      const updatedProjects = projects.filter(p => p.id !== projectId);
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
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error.message}`);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height of 200px
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleChatPopup = () => {
    setIsChatPopupOpen(!isChatPopupOpen);
    if (isChatPopupOpen) {
      setPopupMessages([]);
      setPopupMessage('');
    }
  };

  const scrollToBottom = () => {
    popupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupMessage.trim() || isPopupLoading || !currentProject) return;

    const userMessage = popupMessage.trim();
    setPopupMessage('');
    setIsPopupLoading(true);

    // Add user message to temporary state
    const userPopupMessage = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true
    };
    setPopupMessages(prev => [...prev, userPopupMessage]);

    try {
      // Build the system prompt with business type context
      const businessTypeContext = `You are helping the user build a ${currentProject.selected_model} business. 
      The user's budget is ${currentProject.outputs?.budget || 'not set yet'}. 
      The user's goal is ${currentProject.outputs?.goalIncome || 'not set yet'}.`;

      // Get AI response using the same endpoint as the main chat
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `${systemPrompt}\n\n${businessTypeContext}`
            },
            ...popupMessages.map(msg => ({
              role: msg.isUser ? "user" : "assistant",
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0].message.content,
        isUser: false
      };
      setPopupMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in popup chat:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error. Please try again.",
        isUser: false
      };
      setPopupMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsPopupLoading(false);
    }
  };

  const handleGoalEdit = async (newGoal: string) => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ outputs: { ...currentProject.outputs, goalIncome: newGoal } })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, outputs: { ...currentProject.outputs, goalIncome: newGoal } });
      setIsEditingGoal(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleBudgetEdit = async (newBudget: string) => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ outputs: { ...currentProject.outputs, budget: newBudget } })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, outputs: { ...currentProject.outputs, budget: newBudget } });
      setIsEditingBudget(false);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleLaunchDateEdit = async (newDate: string) => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ outputs: { ...currentProject.outputs, launchDate: newDate } })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, outputs: { ...currentProject.outputs, launchDate: newDate } });
      setIsEditingLaunchDate(false);
    } catch (error) {
      console.error('Error updating launch date:', error);
    }
  };

  const updateBusinessOverview = (key: keyof BusinessOverview, value: string) => {
    setBusinessOverview(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTodos = (moduleId: string, tasks: string[]) => {
    const newTodos = tasks.slice(0, 5).map((task, index) => ({
      id: `${moduleId}-${index}`,
      task,
      completed: false,
      module: moduleId
    }));
    setTodos(newTodos);
  };

  // Add effect to log when projects or dropdown state changes
  useEffect(() => {
    console.log('Projects updated:', projects);
    console.log('Current project:', currentProject);
    console.log('Dropdown state:', showDropdown);
  }, [projects, currentProject, showDropdown]);

  // Update the dropdown toggle handler
  const toggleDropdown = () => {
    console.log('Toggling dropdown. Current state:', !showDropdown);
    console.log('Available projects:', projects);
    setShowDropdown(!showDropdown);
  };

  // Keep the fetchModuleTasks function to display tasks
  const fetchModuleTasks = async () => {
    if (!currentProject) return;

    try {
      const { data: tasks, error } = await supabase
        .from('module_tasks')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('order', { ascending: true })
        .limit(5);  // Only show 5 most recent tasks

      if (error) {
        console.error('Error fetching module tasks:', error);
        return;
      }

      console.log('Fetched module tasks:', tasks);
      setModuleTasks(tasks || []);
    } catch (error) {
      console.error('Error in fetchModuleTasks:', error);
    }
  };

  // Function to handle task completion
  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('module_tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Update local state
      setModuleTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed } : task
        )
      );

      // Update project progress
      if (currentProject) {
        const completedTasks = moduleTasks.filter(t => t.completed).length;
        const progress = Math.round((completedTasks / moduleTasks.length) * 100);
        
        const { error: progressError } = await supabase
          .from('projects')
          .update({ progress })
          .eq('id', currentProject.id);

        if (progressError) {
          console.error('Error updating progress:', progressError);
        } else {
          setCurrentProject({ ...currentProject, progress });
        }
      }
    } catch (error) {
      console.error('Error in handleTaskCompletion:', error);
    }
  };

  // Add this new function after the existing functions
  const calculateTimeRemaining = (launchDate: string) => {
    const total = new Date(launchDate).getTime() - new Date().getTime();
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return { days, hours };
  };

  // Update the checkAndCollectUserData function
  const checkAndCollectUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData, error } = await supabase
        .from('userData')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      // Check if we have all required data
      const hasAllData = userData?.budget && userData?.time && userData?.experience && userData?.goal_income;

      if (!hasAllData) {
        setIsCollectingUserData(true);
        // Let the AI handle the data collection through the chat
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are helping collect user data for their business project. The user needs to provide information about their budget, time commitment, experience level, and income goals. Ask for this information one at a time in a conversational way. Start with the first missing piece of information.`
              },
              {
                role: "user",
                content: "Please help me collect the necessary information for my business project."
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        setCurrentDataPrompt(aiResponse);
      }
    } catch (error) {
      console.error('Error in checkAndCollectUserData:', error);
    }
  };

  // Update the handleUserDataSubmission function
  const handleUserDataSubmission = async (value: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentDataPrompt) return;

      // Get AI's analysis of the user's response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analyze the user's response and determine which piece of information it contains (budget, time, experience, or goal_income). Return a JSON object with the field name and value. If the response doesn't contain any of these, return null.`
            },
            {
              role: "user",
              content: value
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      if (analysis) {
        // Update the user data in the database
        const { error } = await supabase
          .from('userData')
          .update({ [analysis.field]: analysis.value })
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error updating user data:', error);
          return;
        }

        // Update local state
        setUserData(prev => prev ? { ...prev, [analysis.field]: analysis.value } : null);

        // Get the next question from the AI
        const nextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `The user has provided their ${analysis.field}. Ask for the next piece of information needed (budget, time, experience, or goal_income) in a conversational way.`
              },
              {
                role: "user",
                content: value
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!nextResponse.ok) {
          throw new Error('Failed to get AI response');
        }

        const nextData = await nextResponse.json();
        const nextQuestion = nextData.choices[0].message.content;
        setCurrentDataPrompt(nextQuestion);
      }
    } catch (error) {
      console.error('Error in handleUserDataSubmission:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Business Overview Panel */}
      {currentProject && (
        <div className="business-overview">
          <h2>Business Overview</h2>
          <div className="overview-content">
            <div className="project-info-section">
              <h3>Project Info</h3>
              <div className="info-item">
                <strong>Project Name:</strong> {currentProject?.project_name || 'Unnamed Project'}
              </div>
              <div className="info-item">
                <strong>Business Model:</strong> {currentProject?.selected_model?.toUpperCase() || 'Not Set'}
              </div>
              <div className="info-item">
                <strong>Current Stage:</strong> {currentProject?.current_stage || 'Not Set'}
              </div>
              <div className="info-item">
                <strong>Current Step:</strong> {currentProject?.current_step || 'Not Set'}
              </div>
            </div>

            {userData && (
              <div className="user-info-section">
                <h3>User Info</h3>
                <div className="info-item">
                  <strong>Budget:</strong> {userData.budget || 'Not set'}
                </div>
                <div className="info-item">
                  <strong>Time:</strong> {userData.time || 'Not set'}
                </div>
                <div className="info-item">
                  <strong>Experience:</strong> {userData.experience || 'Not set'}
                </div>
                <div className="info-item">
                  <strong>Goal Income:</strong> {userData.goal_income || 'Not set'}
                </div>
              </div>
            )}

            {currentProject?.outputs && Object.keys(currentProject.outputs).length > 0 && (
              <div className="outputs-section">
                <h3>Outputs</h3>
                {Object.entries(currentProject.outputs).map(([key, value]) => (
                  <div key={key} className="output-item">
                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                  </div>
                ))}
              </div>
            )}

            {currentProject?.completed_stages && currentProject.completed_stages.length > 0 && (
              <div className="completed-stages-section">
                <h3>Completed Stages</h3>
                <ul className="completed-stages-list">
                  {currentProject.completed_stages.map((stage, index) => (
                    <li key={index}>{stage}</li>
                  ))}
                </ul>
              </div>
            )}

            {businessOverview.setup && (
              <div className="overview-item">
                <strong>Setup:</strong> {businessOverview.setup}
              </div>
            )}
            {businessOverview.financials && (
              <div className="overview-item">
                <strong>Financials:</strong> {businessOverview.financials}
              </div>
            )}
            {businessOverview.timeline && (
              <div className="overview-item">
                <strong>Timeline:</strong> {businessOverview.timeline}
              </div>
            )}
            {businessOverview.earnings && (
              <div className="overview-item">
                <strong>Earnings:</strong> {businessOverview.earnings}
              </div>
            )}
            {businessOverview.dreams && (
              <div className="overview-item">
                <strong>Goals:</strong> {businessOverview.dreams}
              </div>
            )}
            {businessOverview.alignment && (
              <div className="overview-item">
                <strong>Alignment:</strong> {businessOverview.alignment}
              </div>
            )}
            {businessOverview.readiness && (
              <div className="overview-item">
                <strong>Readiness:</strong> {businessOverview.readiness}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logo Container */}
      <div className="logo-container">
        <div className="logo" onClick={toggleDropdown}>
          <img src="/logo-black.png" alt="Mentar Logo" />
        </div>
        {showDropdown && (
          <div className="dropdown-menu" ref={dropdownRef}>
            {projects && projects.length > 0 ? (
              <>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`dropdown-item ${currentProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => handleProjectSwitch(project)}
                  >
                    <div className="project-item">
                      <span className="project-name">{project.project_name || project.selected_model || 'Unnamed Project'}</span>
                      <span
                        className="delete-project"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        ×
                      </span>
                    </div>
                  </div>
                ))}
                <div className="dropdown-divider" />
              </>
            ) : (
              <div className="dropdown-item disabled">No projects</div>
            )}
            <div className="dropdown-item new-project" onClick={handleNewProject}>
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
          <div className="todo-list-container">
            <h2>Todo List</h2>
            <div className="todo-list">
              {moduleTasks.map((task) => (
                <div key={task.id} className="todo-item">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => handleTaskCompletion(task.id, e.target.checked)}
                  />
                  <span className={task.completed ? 'completed' : ''}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="budget-container">
            <h2>Budget</h2>
            {isEditingBudget ? (
              <div className="editable-field">
                <input
                  type="text"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  onBlur={() => handleBudgetEdit(tempBudget)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBudgetEdit(tempBudget);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="budget-display"
                onClick={() => {
                  setTempBudget(currentProject?.outputs?.budget || '');
                  setIsEditingBudget(true);
                }}
              >
                {currentProject?.outputs?.budget || 'Click to set budget'}
              </div>
            )}
          </div>

          <div className="progress-container">
            <h2>Progress Bar</h2>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentProject?.completed_stages?.length || 0) * 20}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.min((currentProject?.completed_stages?.length || 0) * 20, 100)}% Complete</div>
          </div>

          <div className="goal-container">
            <h2>Goal</h2>
            {isEditingGoal ? (
              <div className="editable-field">
                <input
                  type="text"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onBlur={() => handleGoalEdit(tempGoal)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleGoalEdit(tempGoal);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="goal-display"
                onClick={() => {
                  setTempGoal(currentProject?.outputs?.goalIncome || '');
                  setIsEditingGoal(true);
                }}
              >
                {currentProject?.outputs?.goalIncome || 'Click to set goal'}
              </div>
            )}
          </div>

          <div className="launch-date-container">
            <h2>Launch Date</h2>
            {currentProject?.outputs?.launchDate ? (
              <>
                <div className="launch-date-display">
                  {new Date(currentProject.outputs.launchDate).toLocaleDateString()}
                </div>
                <div className="countdown-timer">
                  {(() => {
                    const { days, hours } = calculateTimeRemaining(currentProject.outputs.launchDate);
                    return (
                      <>
                        <div className="countdown-item">
                          <span className="countdown-value">{days}</span>
                          <span className="countdown-label">Days</span>
                        </div>
                        <div className="countdown-item">
                          <span className="countdown-value">{hours}</span>
                          <span className="countdown-label">Hours</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="launch-date-display">
                Launch date will be set based on your progress
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      {!isAuthChecked ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      ) : !currentProject ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your projects...</p>
          {projects.length === 0 && (
            <p className="loading-message">No projects found. You will be redirected to create a new project.</p>
          )}
        </div>
      ) : (
        <div className="chat-container">
          <div className="messages-container">
            {initialMessage && (
              <div className="message bot">
                <div className="message-content">
                  {initialMessage}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.is_user ? 'user' : 'ai'}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {isCollectingUserData && currentDataPrompt && (
              <div className="message bot">
                <div className="message-content">
                  <h3>Quick Question</h3>
                  <p>{currentDataPrompt}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (isCollectingUserData && currentDataPrompt) {
              handleUserDataSubmission(inputMessage.trim());
              setInputMessage('');
            } else {
              handleSubmit(e);
            }
          }} className="input-container">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isCollectingUserData ? "Enter your answer..." : "Enter response here.."}
              className="message-input"
              disabled={isLoading}
              rows={1}
              autoFocus
            />
            <button type="submit" className="send-button" disabled={isLoading || !inputMessage.trim()}>
              <span className="arrow-up">↑</span>
            </button>
          </form>
        </div>
      )}

      {/* Chat Popup */}
      <button className="speak-to-mentar" onClick={toggleChatPopup}>
        Speak to Mentar
      </button>
      <div className={`chat-popup ${isChatPopupOpen ? 'open' : ''}`}>
        <div className="chat-popup-header">
          <img src="/logo-black.png" alt="Mentar" />
          <button className="close-button" onClick={toggleChatPopup}>X</button>
        </div>
        <div className="chat-popup-content">
          {popupMessages.length === 0 && (
            <div className="message bot">
              How can I help?
            </div>
          )}
          <div className="popup-messages-container">
            {popupMessages.map((message, index) => (
              <div key={index} className={`message ${message.isUser ? 'user' : 'ai'}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ))}
            {isPopupLoading && (
              <div className="message ai">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
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
          <button type="submit" disabled={isPopupLoading || !popupMessage.trim()}>
            <span className="arrow-up">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatInterface;
