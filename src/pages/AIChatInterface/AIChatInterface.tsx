import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import './AIChatInterface.css';

function AIChatInterface() {
  const { messages, handleResponse, addMessage, isComplete, isLoading: onboardingLoading } = useOnboarding();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || onboardingLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      await handleResponse(userMessage);
    } catch (error) {
      console.error('Error in chat:', error);
      addMessage("I apologize, but I'm having trouble connecting right now. Please try again in a moment.", false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="logo-container">
        <h1 className="logo">MentarAI</h1>
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        {(isLoading || onboardingLoading) && (
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
          disabled={isLoading || onboardingLoading}
          autoFocus
        />
        <button type="submit" className="send-button" disabled={isLoading || onboardingLoading}>
          <span className="arrow-up">↑</span>
        </button>
      </form>
    </div>
  );
}

export default AIChatInterface; 