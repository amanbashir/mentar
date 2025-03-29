import { Routes, Route } from 'react-router-dom';
import AIChatInterface from './pages/AIChatInterface/AIChatInterface';

function App() {
  console.log('App mounting');
  
  return (
    <div style={{ height: '100vh', background: 'black' }}>
      <Routes>
        <Route path="/" element={<AIChatInterface />} />
      </Routes>
    </div>
  );
}

export default App; 