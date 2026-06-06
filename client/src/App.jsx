import { useState, useCallback } from 'react';
import Brand from './components/Brand';
import Toast, { useToast } from './components/Toast';
import ScanLearn from './screens/ScanLearn';
import Conversation from './screens/Conversation';
import SessionSummary from './screens/SessionSummary';

export default function App() {
  const { toasts, showToast } = useToast();
  const [screen, setScreen] = useState('scan');  // 'scan' | 'convo' | 'summary'
  const [words, setWords] = useState([]);
  const [results, setResults] = useState([]);

  const handleStartConversation = useCallback((scannedWords) => {
    setWords(scannedWords);
    setScreen('convo');
  }, []);

  const handleConversationComplete = useCallback((roundResults) => {
    setResults(roundResults);
    setScreen('summary');
  }, []);

  const handleRestart = useCallback(() => {
    setResults([]);
    setScreen('convo');
  }, []);

  const handleNewWords = useCallback(() => {
    setWords([]);
    setResults([]);
    setScreen('scan');
  }, []);

  return (
    <>
      <Toast toasts={toasts} />
      <div id="app">
        <Brand />

        <div className={`screen${screen === 'scan' ? ' active' : ''}`}>
          {(screen === 'scan') && (
            <ScanLearn onStartConversation={handleStartConversation} showToast={showToast} />
          )}
        </div>

        <div className={`screen${screen === 'convo' ? ' active' : ''}`}>
          {(screen === 'convo') && (
            <Conversation
              key={results.length}
              words={words}
              showToast={showToast}
              onComplete={handleConversationComplete}
            />
          )}
        </div>

        <div className={`screen${screen === 'summary' ? ' active' : ''}`}>
          {(screen === 'summary') && (
            <SessionSummary
              results={results}
              words={words}
              showToast={showToast}
              onRestart={handleRestart}
              onNewWords={handleNewWords}
            />
          )}
        </div>
      </div>
    </>
  );
}
