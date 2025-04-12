import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import './AIChatInterface.css';
import { systemPrompt } from '../../../lib/mentars/systemPrompt';
import { buildPrompt } from '../../../lib/mentars/promptBuilder';

interface Project {
  id: string;
  business_type: string;
  created_at: string;
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
              businessTypeLower === 'saas' || 
              businessTypeLower === 'copywriting') {
            setInitialMessage(`Hi ${userData?.first_name || ''}, great choice! Let's confirm if this is a good fit for you and your goals.

What's your current budget for this business?`);
          } else {
            setInitialMessage(`Hello ${userData?.first_name || ''}, you've chosen ${businessTypeFromState}.`);
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
        
        if (businessTypeLower === 'ecommerce' || 
            businessTypeLower === 'agency' || 
            businessTypeLower === 'saas' || 
            businessTypeLower === 'copywriting') {
          setInitialMessage(`Hi ${userData.first_name || ''}, great choice! Let's confirm if this is a good fit for you and your goals.

What's your current budget for this business?`);
        } else {
          setInitialMessage(`Hello ${userData.first_name || ''}, you've chosen ${userData.business_type}.`);
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
    fetchUserProjects();
  }, []);

  const fetchUserProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, business_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (projects && projects.length > 0) {
        console.log('Fetched projects:', projects);
        setProjects(projects);
        // Only set current project if none is selected
        if (!currentProject) {
          setCurrentProject(projects[0]);
        }
      } else {
        setProjects([]);
        setCurrentProject(null);
        // Only redirect to onboarding if we're not already there
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
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
    setCurrentProject(project);
    setShowDropdown(false);
  };

  const handleNewProject = () => {
    setShowDropdown(false);
    // Use replace to prevent back navigation issues
    navigate('/onboarding', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !currentProject) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message
      await saveMessage(userMessage, true);

      // Get AI response
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
              content: buildPrompt('stage_0', 'budget')
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
      
      // Save AI response
      await saveMessage(aiResponse, false);
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

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupMessage.trim() || isPopupLoading) return;

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
              content: buildPrompt('stage_0', 'budget')
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

  return (
    <div className="page-container">
      {currentProject ? (
        <>
          <div className="top-bar">
            <div className="logo-container" ref={dropdownRef}>
              <div className="logo" onClick={() => setShowDropdown(!showDropdown)}>
                <img src="/logo-black.png" alt="Mentar" />
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
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
                          title="Delete project"
                        >
                          ✕
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="dropdown-divider"></div>
                  <div 
                    className="dropdown-item new-project"
                    onClick={handleNewProject}
                  >
                    + New Project
                  </div>
                  <div className="dropdown-divider"></div>
                  <div 
                    className="dropdown-item"
                    onClick={() => navigate('/upgrade')}
                  >
                    Upgrade
                  </div>
                  <div 
                    className="dropdown-item"
                    onClick={() => navigate('/settings')}
                  >
                    Settings
                  </div>
                  <div 
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    Log out
                  </div>
                </div>
              )}
            </div>
          </div>
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
            <button className="speak-to-mentar" onClick={toggleChatPopup}>
              Speak to Mentar
            </button>
          </div>
        </>
      ) : (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your projects...</p>
        </div>
      )}

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