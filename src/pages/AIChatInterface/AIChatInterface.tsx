import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import './AIChatInterface.css';

interface Message {
  text: string;
  isUser: boolean;
}

function AIChatInterface() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      text: "Welcome, Aman. I am Mentar, think of me as your head coach. I am always around, whenever you need some advice whether it be about your ongoing journey or anything related to your life.\n\nI am not a chatbot for general info, I am tailored and designed to help you achieve your life and business goals.\n\nLet's start with your full name?",
      isUser: false
    }]);
    setIsInitialized(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    try {
      // Add user message
      setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
      setInputMessage('');
      setIsLoading(true);

      // Only try to call OpenAI if we have an API key
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        const openai = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are Mentar, a professional business and life coach. You help users achieve their life and business goals. Be concise, professional, and encouraging."
            },
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' as const : 'assistant' as const,
              content: msg.text
            })),
            {
              role: 'user' as const,
              content: inputMessage
            }
          ],
          temperature: 0.7,
        });

        if (response.choices[0]?.message?.content) {
          setMessages(prev => [...prev, {
            text: response.choices[0].message.content!,
            isUser: false
          }]);
        }
      } else {
        setError('API key not configured');
        setMessages(prev => [...prev, {
          text: "I apologize, but I'm not properly configured yet. Please check the API key configuration.",
          isUser: false
        }]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="chat-container">
        <div className="messages-container">
          <div className="message ai-message">
            <div className="message-content">
              Initializing chat...
            </div>
          </div>
        </div>
      </div>
    );
  }

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