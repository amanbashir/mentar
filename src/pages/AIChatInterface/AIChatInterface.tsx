import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import './AIChatInterface.css';

interface Message {
  text: string;
  isUser: boolean;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome, Aman. I am Mentar, think of me as your head coach. I am always around, whenever you need some advice whether it be about your ongoing journey or anything related to your life.\n\nI am not a chatbot for general info, I am tailored and designed to help you achieve your life and business goals.\n\nLet's start with your full name?",
      isUser: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll whenever messages change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('API key is not configured. Please check your environment variables.');
      }

      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the latest user message
      conversationHistory.push({
        role: 'user',
        content: inputMessage
      });

      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4", // or "gpt-3.5-turbo" depending on your needs
        messages: [
          {
            role: "system",
            content: "You are Mentar, a professional business and life coach. You help users achieve their life and business goals. Be concise, professional, and encouraging."
          },
          ...conversationHistory
        ],
        temperature: 0.7,
      });

      // Add AI response to messages
      if (response.choices[0]?.message?.content) {
        setMessages(prev => [...prev, {
          text: response.choices[0].message.content,
          isUser: false
        }]);
      }
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      let errorMessage = 'An unknown error occurred';
      
      if (error.message.includes('API key')) {
        errorMessage = 'API key configuration error. Please check your settings.';
      } else if (error.message.includes('Connection')) {
        errorMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      }

      setMessages(prev => [...prev, {
        text: errorMessage,
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
          <div key={index} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="typing-indicator">...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter response here.."
          className="message-input"
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          <span className="arrow-up">↑</span>
        </button>
      </form>
    </div>
  );
}

export default AIChatInterface; 