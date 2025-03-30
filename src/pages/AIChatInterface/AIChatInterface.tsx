import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { startMentorChat } from '../../utils/mentorChat';
import './AIChatInterface.css';

function AIChatInterface() {
  const { messages, handleResponse, addMessage, isComplete, profile } = useOnboarding();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    if (!isComplete) {
      // Use onboarding flow
      await handleResponse(userMessage);
    } else {
      try {
        // Add user message immediately
        addMessage(userMessage, true);

        // Convert messages to OpenAI format
        const chatHistory = messages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

        // Add the latest user message
        chatHistory.push({
          role: 'user' as const,
          content: userMessage
        });

        // Get mentor response
        const mentorResponse = await startMentorChat(
          chatHistory,
          { selectedMentor: 'ecommerce', ...profile }
        );

        // Add AI response after delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        addMessage(mentorResponse, false);
      } catch (error) {
        console.error('Error in mentor chat:', error);
        addMessage("I apologize, but I'm having trouble connecting right now. Please try again in a moment.", false);
      }
    }

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