import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Toast, { useToast } from './components/Toast';
import Sidebar from './components/Sidebar';
import Landing from './screens/Landing';
import ScanLearn from './screens/ScanLearn';
import Conversation from './screens/Conversation';
import SessionSummary from './screens/SessionSummary';
import Progress from './screens/Progress';
import Grammar from './screens/Grammar';
import Audio from './screens/Audio';
import AIChat from './screens/AIChat';

export default function App() {
  const { toasts, showToast } = useToast();
  const navigate = useNavigate();
  
  // App State
  const [user, setUser] = useState(null);
  const [appScreen, setAppScreen] = useState('scan'); // 'scan' | 'convo' | 'summary'
  const [words, setWords] = useState([]);
  const [results, setResults] = useState([]);

  // Check for existing token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        showToast('Successfully signed in!');
        navigate('/');
      } else {
        showToast('Login failed: ' + data.error);
      }
    } catch (err) {
      showToast('Error connecting to server.');
    }
  };

  const handleLoginError = () => {
    showToast('Google Sign-In failed.');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAppScreen('scan');
    navigate('/');
  };

  const handleStartConversation = useCallback((scannedWords) => {
    setWords(scannedWords);
    setAppScreen('convo');
  }, []);

  const handleConversationComplete = useCallback((roundResults) => {
    setResults(roundResults);
    setAppScreen('summary');
  }, []);

  const handleRestart = useCallback(() => {
    setResults([]);
    setAppScreen('convo');
  }, []);

  const handleNewWords = useCallback(() => {
    setWords([]);
    setResults([]);
    setAppScreen('scan');
  }, []);

  // Main Home App Flow Component
  const HomeAppFlow = () => {
    return (
      <div className="main-content">
        {appScreen === 'scan' && (
          <ScanLearn onStartConversation={handleStartConversation} showToast={showToast} />
        )}
        {appScreen === 'convo' && (
          <Conversation
            key={results.length} // Force remount if starting over completely
            words={words}
            showToast={showToast}
            onComplete={handleConversationComplete}
          />
        )}
        {appScreen === 'summary' && (
          <SessionSummary
            results={results}
            words={words}
            showToast={showToast}
            onRestart={handleRestart}
            onNewWords={handleNewWords}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <Toast toasts={toasts} />
      
      {/* If not logged in, show Landing page full screen */}
      {!user ? (
        <Landing onLoginSuccess={handleLoginSuccess} onLoginError={handleLoginError} />
      ) : (
        /* Authenticated Layout with Sidebar */
        <div className="app-layout">
          <Sidebar user={user} onLogout={handleLogout} />
          
          <div className="main-content" style={{ padding: 0 }}>
            <Routes>
              <Route path="/" element={<HomeAppFlow />} />
              <Route path="/chat" element={<AIChat showToast={showToast} />} />
              <Route path="/progress" element={<Progress showToast={showToast} />} />
              <Route path="/grammar" element={<Grammar showToast={showToast} />} />
              <Route path="/audio" element={<Audio showToast={showToast} />} />
            </Routes>
          </div>
        </div>
      )}
    </>
  );
}
