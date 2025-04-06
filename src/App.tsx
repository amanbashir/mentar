import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import AIChatInterface from './pages/AIChatInterface/AIChatInterface';
import Onboarding from './pages/Onboarding/Onboarding';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Register />
        } />
        <Route path="/onboarding" element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Onboarding />
        } />
        <Route path="/dashboard" element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        } />
        <Route path="/chat" element={
          isAuthenticated ? <AIChatInterface /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App; 