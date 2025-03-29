import { Routes, Route } from 'react-router-dom';
import AIChatInterface from './pages/AIChatInterface/AIChatInterface';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AIChatInterface />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App; 