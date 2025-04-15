import { useState, useEffect } from 'react';
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

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { text: INITIAL_MESSAGE, isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
  }, []);

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

    try {
      // Add user message to chat
      const updatedMessages = [...messages, { text: userMessage, isUser: true }];
      setMessages(updatedMessages);

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
        model: "gpt-4",
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
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "I apologize, but I'm having trouble connecting. Please check your internet connection and try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {projectData && <ProjectDetails data={projectData} />}
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