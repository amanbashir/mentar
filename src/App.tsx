import { Routes, Route } from 'react-router-dom';
import AIChatInterface from './pages/AIChatInterface/AIChatInterface';

function App() {
  console.log('App mounting');
  
  return (
    <div style={{ height: '100vh', background: 'black', color: 'white' }}>
      <h1>Debug: App is rendering</h1>
      <Routes>
        <Route path="/" element={
          <div>
            <h2>Debug: Route is matching</h2>
            <AIChatInterface />
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App; 