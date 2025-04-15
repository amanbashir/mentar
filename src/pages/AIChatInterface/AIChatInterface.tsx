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
  todo_1: string;
  todo_2: string;
  todo_3: string;
  todo_4: string;
  business_overview_summary?: string;
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
  const [isEditingLaunchDate, setIsEditingLaunchDate] = useState(false);
  const [tempLaunchDate, setTempLaunchDate] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check if we have a business type from onboarding
    const businessTypeFromState = location.state?.businessType;
    
    const initializeBusinessType = async () => {
      if (businessTypeFromState) {
        setBusinessType(businessTypeFromState);
        const businessTypeLower = businessTypeFromState.toLowerCase();
        
        if (businessTypeLower === 'ecommerce' || 
            businessTypeLower === 'agency' || 
            businessTypeLower === 'software' ||
            businessTypeLower === 'copywriting') {
          setInitialMessage(`Hi! I'm excited to help you build your ${businessType} business. Let's start with your target monthly income goal - what amount would you like to achieve?`);
        } else {
          setInitialMessage(`Hello! I'm excited to help you build your ${businessTypeFromState} business. Let's start with your target monthly income goal - what amount would you like to achieve?`);
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

      const { data: businessData, error } = await supabase
        .from('userData')
        .select('business_type')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching business type:', error);
        navigate('/onboarding');
        return;
      }

      if (businessData?.business_type) {
        setBusinessType(businessData.business_type);
        const businessTypeLower = businessData.business_type.toLowerCase();
        
        // Map business types to their proper names
        const businessTypeMap: Record<string, string> = {
          'ecommerce': 'ecommerce',
          'agency': 'agency',
          'software': 'software',
          'copywriting': 'copywriting'
        };
        
        const properBusinessType = businessTypeMap[businessTypeLower] || businessData.business_type;
        
        setInitialMessage(`Hi! I'm excited to help you build your ${properBusinessType} business. Let's start with your target monthly income goal - what amount would you like to achieve?`);
      } else {
        // If no business type is set, redirect to onboarding
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/onboarding');
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
      // Build the system prompt with business type context
      const businessTypeContext = `You are helping the user build a ${currentProject.business_type} business. 
      The user's budget is ${currentProject.budget || 'not set yet'}. 
      The user's goal is ${currentProject.goal || 'not set yet'}.`;

      // Get AI response using the same endpoint as the main chat
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      await saveMessage(aiResponse, false);

      // Generate and update business overview summary
      try {
        const summaryPrompt = `Summarize the current business as a business overview for the user, including the business type, product/service, target audience, value proposition, and any other key details so far. Be concise and clear.`;
        const contextMessages = [...messages, { is_user: true, content: userMessage }, { is_user: false, content: aiResponse }].slice(-10).map((m) => ({
          role: m.is_user ? 'user' : 'assistant',
          content: m.content
        }));
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...contextMessages,
              { role: 'user', content: summaryPrompt }
            ],
            temperature: 0.5
          })
        });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;
          // Update in DB
          await supabase
            .from('projects')
            .update({ business_overview_summary: summary })
            .eq('id', currentProject.id);
          // Update local state
          setCurrentProject((prev) => prev ? { ...prev, business_overview_summary: summary } : prev);
        }
      } catch (err) {
        console.error('Error updating business overview summary:', err);
      }
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
      // Focus the popup input field after the AI response
      setTimeout(() => {
        const popupInput = document.querySelector('.chat-popup-input input') as HTMLInputElement;
        if (popupInput) {
          popupInput.focus();
        }
      }, 100);
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

  // Helper to get todos from currentProject
  const getProjectTodos = () => {
    if (!currentProject) return [];
    return [
      currentProject.todo_1,
      currentProject.todo_2,
      currentProject.todo_3,
      currentProject.todo_4
    ].filter(Boolean).map((task, idx) => ({
      id: `todo_${idx+1}`,
      title: task,
      completed: false // If you want to track completion, add a completed field to the projects table
    }));
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
      
      // Build the system prompt with business type context
      const businessTypeContext = `You are helping the user build a ${currentProject.business_type} business. 
      The user's budget is ${currentProject.budget || 'not set yet'}. 
      The user's goal is ${currentProject.goal || 'not set yet'}.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `${systemPrompt}\n\n${businessTypeContext}`
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
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      await saveMessage(aiResponse, false);

      // Generate and update business overview summary
      try {
        const summaryPrompt = `Summarize the current business as a business overview for the user, including the business type, product/service, target audience, value proposition, and any other key details so far. Be concise and clear.`;
        const contextMessages = [...messages, { is_user: true, content: userMessage }, { is_user: false, content: aiResponse }].slice(-10).map((m) => ({
          role: m.is_user ? 'user' : 'assistant',
          content: m.content
        }));
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...contextMessages,
              { role: 'user', content: summaryPrompt }
            ],
            temperature: 0.5
          })
        });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;
          // Update in DB
          await supabase
            .from('projects')
            .update({ business_overview_summary: summary })
            .eq('id', currentProject.id);
          // Update local state
          setCurrentProject((prev) => prev ? { ...prev, business_overview_summary: summary } : prev);
        }
      } catch (err) {
        console.error('Error updating business overview summary:', err);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      await saveMessage("I apologize, but I encountered an error. Please try again.", false);
    } finally {
      setIsLoading(false);
      // Ensure the input field is focused after the AI response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
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
              {getProjectTodos().map((task) => (
                <div key={task.id} className="todo-item">
                  <span>{task.title}</span>
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
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter response here.."
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
}

export default AIChatInterface;
