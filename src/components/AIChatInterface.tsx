import { useState, useEffect, useRef } from 'react';
import { INITIAL_MESSAGE } from '../lib/businessDiscovery';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources/chat/completions';
import { systemPrompt } from '../../lib/mentars/systemPrompt';
import { buildPrompt } from '../../lib/mentars/promptBuilder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProjectData, storeProjectData } from '../lib/supabase/projectData';
import { ProjectDetails } from './ProjectDetails';
import { supabase } from '../lib/supabase/supabaseClient';
import './AIChatInterface.css';

interface Message {
  text: string;
  isUser: boolean;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Rate limiting variables
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // Adjust based on your OpenAI plan
const requestTimestamps: number[] = [];

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { text: INITIAL_MESSAGE, isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Get the current user ID from Supabase auth
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch project data for the user
        try {
          const data = await getProjectData(user.id);
          setProjectData(data);
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      }
    };

    getCurrentUser();
    
    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Function to check rate limiting
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    // Remove timestamps older than the window
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
      requestTimestamps.shift();
    }
    
    // Check if we're over the limit
    if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    // Add current timestamp
    requestTimestamps.push(now);
    return true;
  };

  // Function to extract project data from AI responses
  const extractProjectData = (text: string) => {
    // Look for patterns like "Business Idea: [idea]" or "Budget: [amount]"
    const businessIdeaMatch = text.match(/Business Idea:?\s*([^\n]+)/i);
    const briefSummaryMatch = text.match(/Brief Summary:?\s*([^\n]+)/i);
    const totalBudgetMatch = text.match(/Total Budget:?\s*\$?([0-9,]+)/i);
    const expectedLaunchDateMatch = text.match(/Expected Launch Date:?\s*([^\n]+)/i);
    const incomeGoalMatch = text.match(/Income Goal:?\s*\$?([0-9,]+)/i);
    
    // Look for todo items
    const todoMatches = text.match(/Todo \d+:?\s*([^\n]+)/gi);
    
    if (businessIdeaMatch || briefSummaryMatch || totalBudgetMatch || 
        expectedLaunchDateMatch || incomeGoalMatch || todoMatches) {
      
      const extractedData: any = {};
      
      if (businessIdeaMatch) extractedData.business_idea = businessIdeaMatch[1].trim();
      if (briefSummaryMatch) extractedData.brief_summary = briefSummaryMatch[1].trim();
      if (totalBudgetMatch) extractedData.total_budget = parseFloat(totalBudgetMatch[1].replace(/,/g, ''));
      if (expectedLaunchDateMatch) extractedData.expected_launch_date = expectedLaunchDateMatch[1].trim();
      if (incomeGoalMatch) extractedData.income_goal = parseFloat(incomeGoalMatch[1].replace(/,/g, ''));
      
      // Extract todo items
      if (todoMatches) {
        todoMatches.forEach((match, index) => {
          const todoText = match.replace(/Todo \d+:?\s*/i, '').trim();
          if (index === 0) extractedData.todo_1 = todoText;
          if (index === 1) extractedData.todo_2 = todoText;
          if (index === 2) extractedData.todo_3 = todoText;
          if (index === 3) extractedData.todo_4 = todoText;
        });
      }
      
      return extractedData;
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !openai.apiKey || !userId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to chat
      const updatedMessages = [...messages, { text: userMessage, isUser: true }];
      setMessages(updatedMessages);

      // Check rate limiting
      if (!checkRateLimit()) {
        throw new Error("Rate limit exceeded. Please wait a moment before sending another message.");
      }

      // Convert messages to OpenAI format
      const systemMessage: ChatCompletionSystemMessageParam = {
        role: "system",
        content: buildPrompt('ecommerce', 'stage_0', {})
      };

      const chatMessages: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[] = 
        updatedMessages.slice(1).map(m => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text
        }));

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...chatMessages],
        temperature: 0.7
      });

      const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      // Add AI response to chat
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
      
      // Check if the AI response contains project data
      const extractedData = extractProjectData(aiResponse);
      if (extractedData) {
        // Update project data in the database
        try {
          await storeProjectData(userId, extractedData);
          // Refresh project data
          const updatedData = await getProjectData(userId);
          setProjectData(updatedData);
        } catch (error) {
          console.error('Error storing project data:', error);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      // Handle rate limiting error
      if (error.status === 429 || error.message?.includes('rate limit')) {
        setError("You've reached the rate limit. Please wait a moment before trying again.");
        
        // Set a timeout to retry after a delay
        if (retryTimeoutRef.current) {
          window.clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = window.setTimeout(() => {
          setError(null);
          setIsLoading(false);
        }, 10000); // 10 seconds delay
      } else {
        setError("I apologize, but I'm having trouble connecting. Please check your internet connection and try again.");
        setIsLoading(false);
      }
      
      setMessages(prev => [...prev, { 
        text: "I apologize, but I'm having trouble connecting. Please check your internet connection and try again.", 
        isUser: false 
      }]);
    } finally {
      if (!retryTimeoutRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="chat-container">
      {projectData && <ProjectDetails data={projectData} />}
      {error && <div className="error-message">{error}</div>}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'ai'}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
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
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter response here.."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
} 