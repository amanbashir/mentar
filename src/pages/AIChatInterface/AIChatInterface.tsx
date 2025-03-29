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
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      color: '#fff',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '80px'
      }}>
        <div style={{
          color: '#fff',
          marginBottom: '20px'
        }}>
          Welcome message here
        </div>
      </div>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: '#333',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        gap: '10px'
      }}>
        <input 
          type="text"
          placeholder="Type a message..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <button style={{
          background: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer'
        }}>
          ↑
        </button>
      </div>
    </div>
  );
}

export default AIChatInterface; 