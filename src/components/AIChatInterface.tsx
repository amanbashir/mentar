import { useState } from 'react';
import { INITIAL_MESSAGE } from '../lib/businessDiscovery';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources/chat/completions';
import { systemPrompt } from '../../lib/mentars/systemPrompt';
import { buildPrompt } from '../../lib/mentars/promptBuilder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !openai.apiKey) return;

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