import { useState } from 'react';
import './AIChatInterface.css';

interface Message {
  text: string;
  isUser: boolean;
}

function AIChatInterface() {
  console.log('AIChatInterface mounting');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome, Aman. I am Mentar, think of me as your head coach. I am always around, whenever you need some advice whether it be about your ongoing journey or anything related to your life.\n\nI am not a chatbot for general info, I am tailored and designed to help you achieve your life and business goals.\n\nLet's start with your full name?",
      isUser: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
    setInputMessage('');
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
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter response here.."
          className="message-input"
        />
        <button type="submit" className="send-button">
          <span className="arrow-up">↑</span>
        </button>
      </form>
    </div>
  );
}

export default AIChatInterface; 