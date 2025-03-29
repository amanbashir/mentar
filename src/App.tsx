import { Routes, Route } from 'react-router-dom';
import AIChatInterface from './pages/AIChatInterface/AIChatInterface';

function App() {
  console.log('App mounting');
  
  return (
    <div style={{ 
      height: '100vh', 
      background: 'black', 
      color: 'white',
      padding: '20px'
    }}>
      <h1>Debug: App is rendering</h1>
      <div>
        <h2>Debug: Before Routes</h2>
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <h2>Debug: Route "/" matched</h2>
                <AIChatInterface />
              </>
            } 
          />
        </Routes>
        <h2>Debug: After Routes</h2>
      </div>
    </div>
  );
}

export default App; 