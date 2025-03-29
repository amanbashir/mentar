import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Add immediate debug message
console.log('Main mounting');

const root = document.getElementById('root');
console.log('Root element found:', !!root);

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div style={{ color: 'white' }}>
        <h1>Debug: Root is rendering</h1>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </div>
    </React.StrictMode>,
  )
} 