import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import './AIChatInterface.css';
import { systemPrompt } from '../../../lib/mentars/systemPrompt';
import { buildPrompt } from '../../../lib/mentars/promptBuilder';
import { userProfile } from '../../../lib/mentars/userProfile';

interface Project {
  id: string;
  business_type: string;
  created_at: string;
  progress: number;
  goal: string;
  budget: string;
  launch_date: string;
}

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

function AIChatInterface() {
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
  const [userData, setUserData] = useState<{
    first_name: string | null;
    email: string | null;
    avatar_url: string | null;
    business_type: string | null;
    goals: string | null;
    resources: { capital: string | null; time_commitment: string | null } | null;
    interests: string | null;
    hobbies: string | null;
    learning_style: string | null;
    vision: string | null;
    starting_point: { capital: number | null; timeAvailable: string | null; skills: string[] } | null;
    blockers: string[] | null;
    assistance_needed: string | null;
    goalIncome: string | null;
  }>({
    first_name: null,
    email: null,
    avatar_url: null,
    business_type: null,
    goals: null,
    resources: null,
    interests: null,
    hobbies: null,
    learning_style: null,
    vision: null,
    starting_point: null,
    blockers: null,
    assistance_needed: null,
    goalIncome: null
  });

  useEffect(() => {
    // Check if we have a business type from onboarding
    const businessTypeFromState = location.state?.businessType;
    
    const initializeBusinessType = async () => {
      if (businessTypeFromState) {
        setBusinessType(businessTypeFromState);
        // Get user's first name
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
        } else {
          setInitialMessage(`Hi, great choice! Let's confirm if this is a good fit for you and your goals.

What's your current budget for this business?`);
        }
        // Refresh projects list when returning from onboarding
        fetchUserProjects();
      } else {
        // Check if user already has a business type in the database
        checkUserBusinessType();
      }
    };

    initializeBusinessType();
  }, [location.state]);

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
    // Load messages when current project changes
    if (currentProject) {
      fetchProjectMessages(currentProject.id);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    // Handle clicking outside of dropdown to close it
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          setInitialMessage(`Hi ${userData.first_name || ''}, I'm excited to help you build your ${properBusinessType} business! Let's gather some information to create your personalized action plan.

First, what's your current budget for this business? (e.g., $1000, $5000, etc.)`);
        } else {
          setInitialMessage(`Hello ${userData.first_name || ''}, I'm excited to help you build your ${userData.business_type} business! Let's gather some information to create your personalized action plan.

First, what's your current budget for this business? (e.g., $1000, $5000, etc.)`);
        }
      } else {
        setInitialMessage("My name is Mentar. I'm here to help you start your online business. Do you already know what kind of business you want to start?");
      }
    } catch (error) {
      console.error('Error:', error);
      setInitialMessage("My name is Mentar. I'm here to help you start your online business. Do you already know what kind of business you want to start?");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('Session found:', session.user.id);
        setIsAuthChecked(true);
        fetchUserProjects();
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/login');
      }
    };
    
    checkAuth();
  }, []);

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

  const handleProjectSwitch = (project: Project) => {
    console.log('Switching to project:', project);
    setCurrentProject(project);
    setShowDropdown(false);
  };

  const handleNewProject = () => {
    setShowDropdown(false);
    // Use replace to prevent back navigation issues
    navigate('/onboarding', { replace: true });
  };

  const handleSettings = () => {
    // Implement settings handling
    console.log('Settings option clicked');
  };

  // Function to extract and save tasks from AI response
  const extractAndSaveTasks = async (aiResponse: string) => {
    if (!currentProject) return;

    try {
      // Enhanced regex to catch tasks in various formats
      const taskRegex = /(?:^\d+\.\s+|\n\d+\.\s+|^[-•]\s+|\n[-•]\s+|^Task\s*\d*:\s+|\nTask\s*\d*:\s+)(.*?)(?=(?:\n\d+\.|\n[-•]|\nTask\s*\d*:)|$)/gm;
      const matches = aiResponse.matchAll(taskRegex);
      const tasks = Array.from(matches, m => m[1]?.trim())
        .filter(Boolean)
        .filter(task => task.length >= 3); // Filter out very short strings that might not be tasks

      if (tasks.length > 0) {
        console.log('Extracted tasks:', tasks);

        // Get current tasks to determine order and check for duplicates
        const { data: existingTasks, error: countError } = await supabase
          .from('module_tasks')
          .select('title, id')
          .eq('project_id', currentProject.id);

        if (countError) {
          console.error('Error checking existing tasks:', countError);
          return;
        }

        const startOrder = (existingTasks?.length || 0) + 1;
        const existingTitles = new Set(existingTasks?.map(t => t.title.toLowerCase()));

        // Filter out duplicate tasks and create new ones
        const newTasks = tasks.filter(title => !existingTitles.has(title.toLowerCase()));
        
        if (newTasks.length === 0) {
          console.log('No new unique tasks to add');
          return;
        }

        const tasksToInsert = newTasks.map((title, index) => ({
          project_id: currentProject.id,
          title,
          completed: false,
          order: startOrder + index,
          created_at: new Date().toISOString()
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
    if (currentProject.business_type === 'ecommerce' && 
        (aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('software') || 
         aiResponse.toLowerCase().includes('agency'))) {
      // If the response mentions other business types for an ecommerce business, trigger a correction
      const correctedResponse = aiResponse
        .replace(/copywriting business|software business|agency business/g, 'ecommerce business')
        .replace(/copywriter|software founder|agency owner/g, 'online store owner');
      return correctedResponse;
    }
    
    if (currentProject.business_type === 'copywriting' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('software') || 
         aiResponse.toLowerCase().includes('agency'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|software business|agency business/g, 'copywriting business')
        .replace(/online store owner|software founder|agency owner/g, 'copywriter');
      return correctedResponse;
    }
    
    if (currentProject.business_type === 'agency' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('software'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|copywriting business|software business/g, 'agency business')
        .replace(/online store owner|copywriter|software founder/g, 'agency owner');
      return correctedResponse;
    }
    
    if (currentProject.business_type === 'software' && 
        (aiResponse.toLowerCase().includes('ecommerce') || 
         aiResponse.toLowerCase().includes('copywriting') || 
         aiResponse.toLowerCase().includes('agency'))) {
      const correctedResponse = aiResponse
        .replace(/ecommerce business|copywriting business|agency business/g, 'software business')
        .replace(/online store owner|copywriter|agency owner/g, 'software founder');
      return correctedResponse;
    }
  };

  // Add this function to check for missing user data
  const checkMissingUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userDataFromDB, error } = await supabase
        .from('userData')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      // Update local state with user data
      setUserData(userDataFromDB || {
        first_name: null,
        email: null,
        avatar_url: null,
        business_type: null,
        goals: null,
        resources: null,
        interests: null,
        hobbies: null,
        learning_style: null,
        vision: null,
        starting_point: null,
        blockers: null,
        assistance_needed: null,
        goalIncome: null
      });

      // Check for missing fields
      const missingFields = [];
      if (!userDataFromDB?.first_name) missingFields.push('first_name');
      if (!userDataFromDB?.email) missingFields.push('email');
      if (!userDataFromDB?.business_type) missingFields.push('business_type');
      if (!userDataFromDB?.goals) missingFields.push('goals');
      if (!userDataFromDB?.resources?.capital) missingFields.push('resources.capital');
      if (!userDataFromDB?.resources?.time_commitment) missingFields.push('resources.time_commitment');
      if (!userDataFromDB?.interests) missingFields.push('interests');
      if (!userDataFromDB?.hobbies) missingFields.push('hobbies');
      if (!userDataFromDB?.learning_style) missingFields.push('learning_style');
      if (!userDataFromDB?.vision) missingFields.push('vision');
      if (!userDataFromDB?.starting_point?.capital) missingFields.push('starting_point.capital');
      if (!userDataFromDB?.starting_point?.timeAvailable) missingFields.push('starting_point.timeAvailable');
      if (!userDataFromDB?.starting_point?.skills || userDataFromDB?.starting_point?.skills.length === 0) missingFields.push('starting_point.skills');
      if (!userDataFromDB?.blockers || userDataFromDB?.blockers.length === 0) missingFields.push('blockers');
      if (!userDataFromDB?.assistance_needed) missingFields.push('assistance_needed');

      return missingFields;
    } catch (error) {
      console.error('Error checking missing user data:', error);
      return [];
    }
  };

  // Add this function to update user data
  const updateUserData = async (updates: Partial<typeof userData>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update the database
      const { error } = await supabase
        .from('userData')
        .update(updates)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating user data:', error);
        return;
      }

      // Update local state
      setUserData((prev: typeof userData) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error in updateUserData:', error);
    }
  };

  // Add this function to extract user data from AI responses
  const extractUserData = (aiResponse: string) => {
    console.log("Extracting user data from AI response:", aiResponse);
    
    // Extract first name if not already set
    if (!userData.first_name) {
      const nameRegex = /(?:your name is|you are|you're|you are called|you go by) ([A-Za-z]+)/i;
      const nameMatch = aiResponse.match(nameRegex);
      if (nameMatch) {
        console.log("Extracted first name:", nameMatch[1]);
        updateUserData({ first_name: nameMatch[1] });
      }
    }

    // Extract goals if not already set
    if (!userData.goals) {
      const goalsRegex = /(?:your goal is|main goal is|goal to|aiming to|want to|you want to) (.*?)(?:\.|\n|$)/i;
      const goalsMatch = aiResponse.match(goalsRegex);
      if (goalsMatch) {
        console.log("Extracted goals:", goalsMatch[1].trim());
        updateUserData({ goals: goalsMatch[1].trim() });
      }
    }

    // Extract budget/capital if not already set
    if (!userData.resources?.capital) {
      // Look for budget mentions in the AI response
      const budgetRegex = /\$\d+(?:,\d{3})*|\d+\s*(?:dollars?|USD)/gi;
      const budgetMatch = aiResponse.match(budgetRegex);
      if (budgetMatch) {
        const budget = budgetMatch[0].replace(/\s*dollars?|USD/i, '');
        console.log("Extracted budget:", budget);
        updateUserData({ 
          resources: { 
            capital: budget,
            time_commitment: userData.resources?.time_commitment || null
          } 
        });
      }
      
      // Also check for budget in user's last message
      if (messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1].content;
        const userBudgetRegex = /\$\d+(?:,\d{3})*|\d+\s*(?:dollars?|USD)/gi;
        const userBudgetMatch = lastUserMessage.match(userBudgetRegex);
        if (userBudgetMatch) {
          const budget = userBudgetMatch[0].replace(/\s*dollars?|USD/i, '');
          console.log("Extracted budget from user message:", budget);
          updateUserData({ 
            resources: { 
              capital: budget,
              time_commitment: userData.resources?.time_commitment || null
            } 
          });
        }
      }
    }

    // Extract time commitment if not already set
    if (!userData.resources?.time_commitment) {
      // Look for time commitment in the AI response
      const timeRegex = /(\d+)\s*(?:hours?|hrs?)\s*(?:per|a)\s*(?:week|day)/i;
      const timeMatch = aiResponse.match(timeRegex);
      if (timeMatch) {
        const timeCommitment = `${timeMatch[1]} hours per week`;
        console.log("Extracted time commitment:", timeCommitment);
        updateUserData({ 
          resources: { 
            capital: userData.resources?.capital || null,
            time_commitment: timeCommitment
          } 
        });
      }
      
      // Also check for time commitment in user's last message
      if (messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1].content;
        const userTimeRegex = /(\d+)\s*(?:hours?|hrs?)\s*(?:per|a)\s*(?:week|day)/i;
        const userTimeMatch = lastUserMessage.match(userTimeRegex);
        if (userTimeMatch) {
          const timeCommitment = `${userTimeMatch[1]} hours per week`;
          console.log("Extracted time commitment from user message:", timeCommitment);
          updateUserData({ 
            resources: { 
              capital: userData.resources?.capital || null,
              time_commitment: timeCommitment
            } 
          });
        }
      }
    }

    // Extract dream income if not already set
    if (!userData.goalIncome) {
      // Look for dream income in the AI response
      const dreamIncomeRegex = /(?:dream|target|goal|desired|monthly|income|earnings|revenue) (?:of|is|about|around|approximately)?\s*\$?(\d+(?:,\d{3})*|\d+)\s*(?:per month|monthly|a month)/i;
      const dreamIncomeMatch = aiResponse.match(dreamIncomeRegex);
      if (dreamIncomeMatch) {
        const dreamIncome = dreamIncomeMatch[1].replace(/,/g, '');
        console.log("Extracted dream income:", dreamIncome);
        updateUserData({ goalIncome: dreamIncome });
      }
      
      // Also check for dream income in user's last message
      if (messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1].content;
        const userDreamIncomeRegex = /(?:dream|target|goal|desired|monthly|income|earnings|revenue) (?:of|is|about|around|approximately)?\s*\$?(\d+(?:,\d{3})*|\d+)\s*(?:per month|monthly|a month)/i;
        const userDreamIncomeMatch = lastUserMessage.match(userDreamIncomeRegex);
        if (userDreamIncomeMatch) {
          const dreamIncome = userDreamIncomeMatch[1].replace(/,/g, '');
          console.log("Extracted dream income from user message:", dreamIncome);
          updateUserData({ goalIncome: dreamIncome });
        }
        
        // Also check for direct number responses
        const directNumberRegex = /\$?(\d+(?:,\d{3})*|\d+)\s*(?:per month|monthly|a month)/i;
        const directNumberMatch = lastUserMessage.match(directNumberRegex);
        if (directNumberMatch) {
          const dreamIncome = directNumberMatch[1].replace(/,/g, '');
          console.log("Extracted direct number as dream income:", dreamIncome);
          updateUserData({ goalIncome: dreamIncome });
        }
      }
    }

    // Extract interests if not already set
    if (!userData.interests) {
      const interestsRegex = /(?:interested in|passionate about|fascinated by|like|enjoy) (.*?)(?:\.|\n|$)/i;
      const interestsMatch = aiResponse.match(interestsRegex);
      if (interestsMatch) {
        console.log("Extracted interests:", interestsMatch[1].trim());
        updateUserData({ interests: interestsMatch[1].trim() });
      }
    }

    // Extract hobbies if not already set
    if (!userData.hobbies) {
      const hobbiesRegex = /(?:hobbies|hobby|activities|free time) (?:include|are|is) (.*?)(?:\.|\n|$)/i;
      const hobbiesMatch = aiResponse.match(hobbiesRegex);
      if (hobbiesMatch) {
        console.log("Extracted hobbies:", hobbiesMatch[1].trim());
        updateUserData({ hobbies: hobbiesMatch[1].trim() });
      }
    }

    // Extract learning style if not already set
    if (!userData.learning_style) {
      const learningStyleRegex = /(?:learn|learning|study) (?:best|better|prefer) (?:by|through|via) (.*?)(?:\.|\n|$)/i;
      const learningStyleMatch = aiResponse.match(learningStyleRegex);
      if (learningStyleMatch) {
        console.log("Extracted learning style:", learningStyleMatch[1].trim());
        updateUserData({ learning_style: learningStyleMatch[1].trim() });
      }
    }

    // Extract vision if not already set
    if (!userData.vision) {
      const visionRegex = /(?:vision|dream|aspiration|ambition) (?:is|to) (.*?)(?:\.|\n|$)/i;
      const visionMatch = aiResponse.match(visionRegex);
      if (visionMatch) {
        console.log("Extracted vision:", visionMatch[1].trim());
        updateUserData({ vision: visionMatch[1].trim() });
      }
    }

    // Extract skills if not already set
    if (!userData.starting_point?.skills || userData.starting_point.skills.length === 0) {
      const skillsRegex = /(?:skills|abilities|capabilities) (?:include|are) (.*?)(?:\.|\n|$)/i;
      const skillsMatch = aiResponse.match(skillsRegex);
      if (skillsMatch) {
        const skills = skillsMatch[1].split(/,|\sand\s/).map(skill => skill.trim());
        console.log("Extracted skills:", skills);
        updateUserData({ 
          starting_point: { 
            capital: userData.starting_point?.capital || null,
            timeAvailable: userData.starting_point?.timeAvailable || null,
            skills 
          } 
        });
      }
    }

    // Extract blockers if not already set
    if (!userData.blockers || userData.blockers.length === 0) {
      const blockersRegex = /(?:blockers|obstacles|challenges|difficulties) (?:include|are) (.*?)(?:\.|\n|$)/i;
      const blockersMatch = aiResponse.match(blockersRegex);
      if (blockersMatch) {
        const blockers = blockersMatch[1].split(/,|\sand\s/).map(blocker => blocker.trim());
        console.log("Extracted blockers:", blockers);
        updateUserData({ blockers });
      }
    }

    // Extract assistance needed if not already set
    if (!userData.assistance_needed) {
      const assistanceRegex = /(?:need help with|assistance with|support with) (.*?)(?:\.|\n|$)/i;
      const assistanceMatch = aiResponse.match(assistanceRegex);
      if (assistanceMatch) {
        console.log("Extracted assistance needed:", assistanceMatch[1].trim());
        updateUserData({ assistance_needed: assistanceMatch[1].trim() });
      }
    }
  };

  // Modify the handleSubmit function to handle the sequential questions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await saveMessage(userMessage, true);

      // Check for missing user data
      const missingFields = await checkMissingUserData();
      
      // Build the system prompt with business type context and missing fields
      const businessTypeContext = `You are helping the user build a ${currentProject.business_type} business. 
      The user's budget is ${currentProject.budget || 'not set yet'}. 
      The user's goal is ${currentProject.goal || 'not set yet'}.`;
      
      // Add instructions to collect missing user data if any
      let dataCollectionInstructions = '';
      if (missingFields && missingFields.length > 0) {
        dataCollectionInstructions = `
        Please try to collect the following missing user information in your response:
        ${missingFields.join(', ')}
        
        Extract this information naturally from the conversation without explicitly asking for it.
        If you can't determine a value, don't make one up.
        `;
      }

      // Add instructions for sequential questions
      const sequentialQuestionInstructions = `
      You are in a conversation with the user. Based on their last message, determine which question to ask next.
      
      The questions should be asked in this order:
      1. What's your current budget for this business? (e.g., $1000, $5000, etc.)
      2. How many hours per week can you commit to building this business?
      3. What's your main goal with this business? (e.g., replace current income, build a side hustle, etc.)
      4. What's your dream monthly income from this business? (e.g., $5000, $10000, etc.)
      5. What relevant skills or experience do you already have?
      6. What are your main interests or passions that could align with this business?
      7. What's your preferred learning style? (e.g., hands-on practice, reading, video tutorials, etc.)
      8. What's your vision for this business in the next 6 months?
      9. What potential challenges or blockers do you foresee?
      10. What specific areas do you need the most help with?
      
      After the user answers a question, ask the next one in sequence. If they've answered all questions, 
      provide a summary of their responses and start giving them actionable advice for their business.
      `;

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
              content: `${systemPrompt}\n\n${businessTypeContext}\n\n${dataCollectionInstructions}\n\n${sequentialQuestionInstructions}`
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
      extractBudgetAndGoal(aiResponse);
      extractBusinessOverview(aiResponse);
      
      // Extract user data from the AI response
      extractUserData(aiResponse);
    } catch (error) {
      console.error('Error in chat:', error);
      await saveMessage("I apologize, but I encountered an error. Please try again.", false);
    } finally {
      setIsLoading(false);
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

  // Modify the handlePopupSubmit function to include user data extraction
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
      // Check for missing user data
      const missingFields = await checkMissingUserData();
      
      // Build the system prompt with business type context and missing fields
      const businessTypeContext = `You are helping the user build a ${currentProject.business_type} business. 
      The user's budget is ${currentProject.budget || 'not set yet'}. 
      The user's goal is ${currentProject.goal || 'not set yet'}.`;
      
      // Add instructions to collect missing user data if any
      let dataCollectionInstructions = '';
      if (missingFields && missingFields.length > 0) {
        dataCollectionInstructions = `
        Please try to collect the following missing user information in your response:
        ${missingFields.join(', ')}
        
        Extract this information naturally from the conversation without explicitly asking for it.
        If you can't determine a value, don't make one up.
        `;
      }

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
              content: `${systemPrompt}\n\n${businessTypeContext}\n\n${dataCollectionInstructions}`
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
      
      // Extract user data from the AI response
      extractUserData(aiMessage.content);
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
        .update({ goal: newGoal })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, goal: newGoal });
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
        .update({ budget: newBudget })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, budget: newBudget });
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
        .update({ launch_date: newDate })
        .eq('id', currentProject.id);

      if (error) throw error;
      
      setCurrentProject({ ...currentProject, launch_date: newDate });
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
    console.log('Dropdown state:', showDropdown);
  }, [projects, showDropdown]);

  // Update the dropdown toggle handler
  const toggleDropdown = () => {
    console.log('Toggling dropdown. Current state:', !showDropdown);
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
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

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

  // Add effect to fetch tasks when current project changes
  useEffect(() => {
    if (currentProject) {
      fetchModuleTasks();
    }
  }, [currentProject]);

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

  // Add useEffect to check for missing user data on component mount
  useEffect(() => {
    const checkUserData = async () => {
      await checkMissingUserData();
    };
    
    checkUserData();
  }, []);

  return (
    <div className="page-container">
      {/* Business Overview Panel */}
      {currentProject && (
        <div className="business-overview">
          <h2>Business Summary</h2>
          <div className="overview-content">
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
            {projects.length > 0 ? (
              <>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`dropdown-item ${currentProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => handleProjectSwitch(project)}
                  >
                    <div className="project-item">
                      <span className="project-name">{project.business_type}</span>
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
                  setTempBudget(currentProject?.budget || '');
                  setIsEditingBudget(true);
                }}
              >
                {currentProject?.budget || 'Click to set budget'}
              </div>
            )}
          </div>

          <div className="progress-container">
            <h2>Progress Bar</h2>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${currentProject?.progress || 0}%` }}
              ></div>
            </div>
            <div className="progress-text">{currentProject?.progress || 0}% Complete</div>
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
                  setTempGoal(currentProject?.goal || '');
                  setIsEditingGoal(true);
                }}
              >
                {currentProject?.goal || 'Click to set goal'}
              </div>
            )}
          </div>

          <div className="launch-date-container">
            <h2>Launch Date</h2>
            {currentProject?.launch_date ? (
              <>
                <div className="launch-date-display">
                  {new Date(currentProject.launch_date).toLocaleDateString()}
                </div>
                <div className="countdown-timer">
                  {(() => {
                    const { days, hours } = calculateTimeRemaining(currentProject.launch_date);
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
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="input-container">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter response here.."
              className="message-input"
              disabled={isLoading}
              rows={1}
              autoFocus
            />
            <button type="submit" className="send-button" disabled={isLoading}>
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
}

export default AIChatInterface;
