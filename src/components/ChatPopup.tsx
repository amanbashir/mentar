import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatPopup.css";
import "../pages/AIChatInterface/AIChatInterface.css";

interface Message {
  content: string;
  isUser: boolean;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  inputMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  markdownComponents?: any;
}

const ChatPopup: React.FC<ChatPopupProps> = ({
  isOpen,
  onClose,
  messages,
  isLoading,
  inputMessage,
  onInputChange,
  onKeyDown,
  onSubmit,
  markdownComponents,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`chat-popup ${isOpen ? "open" : ""}`}>
      <div className="chat-popup-header">
        <img src="/logo-black.png" alt="Mentar" />
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="chat-popup-content">
        {messages.length === 0 && (
          <div className="message bot">How can I help?</div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? "user" : "bot"}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="typing-indicator" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={onSubmit} className="chat-popup-input">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Enter chat here.."
          disabled={isLoading}
          rows={1}
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          <span className="arrow-up">↑</span>
        </button>
      </form>
    </div>
  );
};

export default ChatPopup;
