import './AIChatInterface.css';

function AIChatInterface() {
  console.log('AIChatInterface mounting');

  return (
    <div style={{ 
      color: 'white', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'black'
    }}>
      <h1>Chat Interface</h1>
      <p>Test Message</p>
    </div>
  );
}

export default AIChatInterface; 