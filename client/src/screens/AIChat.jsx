import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { playNativeAudio } from '../utils/audio';
import ScoreRing from '../components/ScoreRing';
import { MessageSquare, Mic, Play, Send, Sparkles, Volume2, RotateCcw, CheckCircle, XCircle, Award, AwardIcon } from 'lucide-react';

const scenarios = [
  {
    id: "cafe",
    title: "Au Café de Paris",
    level: "A1/A2",
    description: "Order drinks and pastries, ask for recommendations, and request the bill from a Parisian waiter.",
    initialAiMessage: "Bonjour ! Bienvenue au Café de Paris. Que puis-je vous servir aujourd'hui ?"
  },
  {
    id: "hotel",
    title: "À la Réception de l'Hôtel",
    level: "B1",
    description: "Check into a hotel, ask about amenities (Wi-Fi, breakfast), and request local sightseeing tips.",
    initialAiMessage: "Bonjour madame, monsieur. J'ai votre réservation sous les yeux. Pourriez-vous me confirmer votre nom de famille ?"
  },
  {
    id: "voyage",
    title: "Planification de Voyage",
    level: "B1/B2",
    description: "Discuss travel plans with a French tourism agent, outlining your budget and preferred destinations.",
    initialAiMessage: "Bonjour ! Je suis ravi de vous aider à organiser vos vacances en France. Quel genre de voyage préférez-vous : plutôt mer, montagne, ou culturel ?"
  },
  {
    id: "entretien",
    title: "Entretien d'Embauche",
    level: "B2",
    description: "Simulate a formal job interview in French. Speak about your qualifications and why you want the job.",
    initialAiMessage: "Bonjour. Je vous en prie, asseyez-vous. Parlez-moi un peu de vos motivations pour rejoindre notre équipe."
  }
];

export default function AIChat({ showToast }) {
  const { callApi, loading } = useApi(showToast);
  
  // App States
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTutorThinking, setIsTutorThinking] = useState(false);
  
  // Evaluation screen state
  const [evaluation, setEvaluation] = useState(null);
  const [evaluatingChat, setEvaluatingChat] = useState(false);
  
  // SpeechRecognition hook
  const { supported, isRecording, transcript, error, startListening, stopListening } = useSpeechRecognition();
  
  const scrollRef = useRef(null);

  // Sync speech transcript to user input text field
  useEffect(() => {
    if (transcript) {
      setUserInput(transcript);
    }
  }, [transcript]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog, isTutorThinking]);

  // Speak AI message automatically when it is added
  const speakMessage = (text) => {
    playNativeAudio(text).catch(err => {
      console.warn('[AIChat Voice failed]', err);
    });
  };

  const handleStartChat = (scenario) => {
    setSelectedScenario(scenario);
    const initialMsg = { sender: 'ai', text: scenario.initialAiMessage, timestamp: new Date() };
    setChatLog([initialMsg]);
    
    // Speak initial greeting
    setTimeout(() => {
      speakMessage(scenario.initialAiMessage);
    }, 400);
  };

  const handleSend = async () => {
    const textToSend = userInput.trim();
    if (!textToSend) return;

    // Add user message to log
    const userMsg = { sender: 'user', text: textToSend, timestamp: new Date() };
    const updatedLog = [...chatLog, userMsg];
    setChatLog(updatedLog);
    setUserInput('');
    stopListening();

    // Generate response from AI tutor
    setIsTutorThinking(true);
    const data = await callApi('/api/ai/chat-reply', {
      chatLog: updatedLog,
      topic: selectedScenario.title
    });

    if (data && data.reply) {
      const aiReply = { sender: 'ai', text: data.reply, timestamp: new Date() };
      setChatLog(prev => [...prev, aiReply]);
      speakMessage(data.reply);
    } else {
      const fallbackReply = { sender: 'ai', text: "Pardon, je n'ai pas bien compris. Pourriez-vous répéter ?", timestamp: new Date() };
      setChatLog(prev => [...prev, fallbackReply]);
      speakMessage(fallbackReply.text);
    }
    setIsTutorThinking(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleEndConversation = async () => {
    if (chatLog.length < 3) {
      showToast('Please exchange at least a few messages before evaluating!');
      return;
    }

    setEvaluatingChat(true);
    const result = await callApi('/api/ai/evaluate-chat', { chatLog });
    if (result) {
      setEvaluation(result);
    } else {
      showToast('Could not evaluate conversation. Please try again.');
    }
    setEvaluatingChat(false);
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setChatLog([]);
    setEvaluation(null);
    setUserInput('');
  };

  return (
    <div className="screen-container" style={{ maxWidth: '800px', width: '100%', paddingTop: '20px', paddingBottom: '60px' }}>
      
      {/* 1. SCENARIO SELECTOR */}
      {!selectedScenario && !evaluation && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '4px' }}>Tuteur de Chat IA</h2>
            <p className="section-sub" style={{ textAlign: 'left', marginBottom: '16px' }}>
              Speak naturally in French with an AI conversational agent. The agent talks back to you. When done, get a report card on your spelling and fluency!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {scenarios.map((s) => (
              <div
                key={s.id}
                onClick={() => handleStartChat(s)}
                className="stat-card"
                style={{
                  padding: '28px',
                  cursor: 'pointer',
                  border: '1px solid rgba(240, 230, 200, 0.05)',
                  transition: 'all 0.25s ease',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(240, 230, 200, 0.05)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
                      Level {s.level}
                    </span>
                    <MessageSquare size={16} style={{ color: 'var(--muted)' }} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>
                    {s.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 2. ACTIVE CHAT PANEL */}
      {selectedScenario && !evaluation && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', border: '1px solid rgba(240,230,200,0.06)', padding: '16px 24px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Scénario de Conversation</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--cream)', marginTop: '2px' }}>{selectedScenario.title}</h3>
            </div>
            
            <button
              onClick={handleEndConversation}
              disabled={chatLog.length < 3 || evaluatingChat}
              className="btn-primary"
              style={{ margin: 0, padding: '10px 20px', minWidth: 'auto', background: 'var(--gold)', color: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {evaluatingChat ? (
                <><span className="spinner" /> Évaluation...</>
              ) : (
                <><Sparkles size={16} /> Évaluer &amp; Quitter</>
              )}
            </button>
          </div>

          {/* Chat Logs Area */}
          <div ref={scrollRef} className="chat-container">
            {chatLog.map((msg, idx) => {
              const isAI = msg.sender === 'ai';
              return (
                <div key={idx} className={`chat-bubble ${isAI ? 'ai' : 'user'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '2px' }}>
                    <span className="chat-bubble-meta">{isAI ? 'Tuteur' : 'Vous'}</span>
                    {isAI && (
                      <button
                        onClick={() => speakMessage(msg.text)}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '2px' }}
                        title="Replay Audio"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0 }}>{msg.text}</p>
                </div>
              );
            })}
            
            {isTutorThinking && (
              <div className="chat-bubble ai" style={{ opacity: 0.7 }}>
                <span className="chat-bubble-meta">Tuteur</span>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" /> Réflexion...
                </p>
              </div>
            )}
          </div>

          {/* Chat Inputs */}
          <div className="chat-input-wrapper">
            {/* Mic Dictation */}
            <button
              onClick={handleMicClick}
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              style={{ width: '42px', height: '42px', boxShadow: 'none', background: isRecording ? 'var(--red)' : 'var(--card-alt)', color: isRecording ? 'white' : 'var(--gold)', border: '1px solid rgba(201, 168, 76, 0.2)', flexShrink: 0 }}
            >
              <Mic size={18} />
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              className="chat-input"
              placeholder={isRecording ? "Listening... speak now in French" : "Répondez en français..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTutorThinking}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || isTutorThinking}
              style={{ background: 'var(--gold)', color: 'var(--bg)', border: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: userInput.trim() ? 1 : 0.4 }}
            >
              <Send size={18} />
            </button>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
        </div>
      )}

      {/* 3. EVALUATION REPORT CARD */}
      {evaluation && (
        <div style={{ animation: 'fadeUp 0.3s var(--ease)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ textAlign: 'left', margin: 0 }}>Fluency Report Card</h2>
            <button
              onClick={handleReset}
              className="btn-primary"
              style={{ margin: 0, padding: '10px 18px', minWidth: 'auto', background: 'none', border: '1px solid rgba(240,230,200,0.1)', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RotateCcw size={16} /> New Chat
            </button>
          </div>

          {/* Dynamic Score Cards */}
          <div className="report-grid">
            <div className="stat-card" style={{ alignItems: 'center', padding: '16px 10px' }}>
              <p className="stat-label" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>Fluency</p>
              <ScoreRing score={evaluation.fluencyScore || 0} size={76} strokeWidth={5} />
            </div>
            
            <div className="stat-card" style={{ alignItems: 'center', padding: '16px 10px' }}>
              <p className="stat-label" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>Vocabulary</p>
              <ScoreRing score={evaluation.vocabularyScore || 0} size={76} strokeWidth={5} />
            </div>

            <div className="stat-card" style={{ alignItems: 'center', padding: '16px 10px' }}>
              <p className="stat-label" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>Grammar</p>
              <ScoreRing score={evaluation.grammarScore || 0} size={76} strokeWidth={5} />
            </div>

            <div className="stat-card" style={{ alignItems: 'center', padding: '16px 10px' }}>
              <p className="stat-label" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>Speech accuracy</p>
              <ScoreRing score={evaluation.pronunciationScore || 0} size={76} strokeWidth={5} />
            </div>
          </div>

          {/* Detailed Feedback Review */}
          <div className="stat-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <p className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Award size={16} /> Tutor Review
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--cream)', margin: 0 }}>
              {evaluation.feedback}
            </p>
            {evaluation.tip && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(201,168,76,0.05)', borderLeft: '2px solid var(--gold)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--gold)' }}>
                💡 <strong>Tutor Tip:</strong> {evaluation.tip}
              </div>
            )}
          </div>

          {/* Grammar Corrections accordion list */}
          <div className="stat-card" style={{ padding: '24px' }}>
            <p className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MessageSquare size={16} /> Phrasing &amp; Grammar Improvements
            </p>
            
            {(!evaluation.corrections || evaluation.corrections.length === 0) ? (
              <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                <CheckCircle size={18} /> Perfect! No grammatical errors or spelling slips detected.
              </p>
            ) : (
              <div className="correction-list">
                {evaluation.corrections.map((corr, idx) => (
                  <div key={idx} className="correction-card">
                    <p className="correction-original">
                      ❌ "{corr.original}"
                    </p>
                    <p className="correction-fixed">
                      ✅ "{corr.corrected}"
                    </p>
                    <p className="correction-explanation">
                      {corr.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
