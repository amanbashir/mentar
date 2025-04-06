import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './AIChatInterface.css';

function AIChatInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [businessType, setBusinessType] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a business type from onboarding
    const businessTypeFromState = location.state?.businessType;
    
    if (businessTypeFromState) {
      setBusinessType(businessTypeFromState);
      setInitialMessage(`You've chosen ${businessTypeFromState}.`);
    } else {
      // Check if user already has a business type in the database
      checkUserBusinessType();
    }
  }, [location.state]);

  const checkUserBusinessType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('userData')
        .select('business_type')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (userData?.business_type) {
        setBusinessType(userData.business_type);
        setInitialMessage(`You've chosen ${userData.business_type}.`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message to chat
      setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

      // TODO: Implement actual chat functionality
      // For now, just echo back a simple response
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "Thank you for your message. I'm here to help you with your business journey.", 
          isUser: false 
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.", 
        isUser: false 
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {initialMessage && (
          <div className="message ai-message">
            <div className="message-content">
              {initialMessage}
            </div>
          </div>
        )}
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
          autoFocus
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          <span className="arrow-up">↑</span>
        </button>
      </form>
    </div>
  );
}

export default AIChatInterface; 