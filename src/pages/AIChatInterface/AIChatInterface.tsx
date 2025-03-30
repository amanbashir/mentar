import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { startMentorChat } from '../../utils/mentorChat';
import './AIChatInterface.css';

function AIChatInterface() {
  const { messages, handleResponse, isComplete, profile } = useOnboarding();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    
    if (isComplete) {
      // Use mentor chat after onboarding is complete
      const mentorResponse = await startMentorChat(
        messages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })),
        { selectedMentor: 'ecommerce', ...profile }
      );
      
      // Add user message
      handleResponse(inputMessage);
      
      // Add mentor response after a delay
      setTimeout(() => {
        handleResponse(mentorResponse);
      }, 1000);
    } else {
      // Use onboarding flow
      await handleResponse(inputMessage);
    }
    
    setInputMessage('');
    setIsLoading(false);
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