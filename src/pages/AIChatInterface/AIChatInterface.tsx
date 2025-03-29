import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
// Remove CSS import temporarily
// import './AIChatInterface.css';

interface Message {
  text: string;
  isUser: boolean;
}

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function AIChatInterface() {
  console.log('AIChatInterface mounting');
  console.log('API Key exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
  console.log('Environment:', import.meta.env.MODE);
  
  const [error, setError] = useState<string | null>(null);

  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    console.log('No API key found');
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        <h2>Error: API Key Missing</h2>
        <p>Please configure the OpenAI API key in environment variables.</p>
      </div>
    );
  }

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
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory: ChatCompletionMessage[] = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: 'system' as const,
            content: "You are Mentar, a professional business and life coach. You help users achieve their life and business goals. Be concise, professional, and encouraging."
          },
          ...conversationHistory,
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
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    padding: '20px',
    color: 'white',
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  };

  const messageStyle = {
    maxWidth: '600px',
    padding: '10px',
    whiteSpace: 'pre-wrap' as const,
  };

  const inputContainerStyle = {
    display: 'flex',
    gap: '10px',
    padding: '15px',
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    borderRadius: '12px',
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '760px',
  };

  return (
    <div style={containerStyle}>
      <h2>Debug: AIChatInterface Rendering</h2>
      <div style={messagesStyle}>
        {messages.map((message, index) => (
          <div key={index} style={messageStyle} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div style={messageStyle} className="message ai-message">
            <div className="typing-indicator">...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={inputContainerStyle}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter response here.."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '16px',
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={isLoading}
        >
          ↑
        </button>
      </form>
    </div>
  );
}

export default AIChatInterface; 