import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Flame, TrendingUp, BookOpen, Clock, Calendar, Sparkles, Volume2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Progress({ showToast }) {
  const { getApi, loading } = useApi(showToast);
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);

  // Fetch session history on load
  useEffect(() => {
    async function loadData() {
      const data = await getApi('/api/sessions');
      if (data) {
        setSessions(data);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch logged in user from localStorage
  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const streak = user?.streak || 1;

  // Calculate statistics
  const totalSessions = sessions.length;
  const avgScore = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.averageScore || 0), 0) / totalSessions)
    : 0;

  // Gather unique words
  const uniqueWordsSet = new Set();
  sessions.forEach(s => {
    if (s.words && Array.isArray(s.words)) {
      s.words.forEach(w => uniqueWordsSet.add(w.toLowerCase()));
    }
  });
  const vocabWords = Array.from(uniqueWordsSet);
  const vocabCount = vocabWords.length;

  // Speak a vocabulary word
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Text-to-speech not supported in this browser.');
    }
  };

  // Generate last 7 days activity
  const getLast7Days = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = weekdays[d.getDay()];
      const dateStr = d.toDateString();
      
      // Check if user has a session on this calendar day
      const didPractice = sessions.some(s => {
        const sessionDate = new Date(s.createdAt);
        return sessionDate.toDateString() === dateStr;
      });

      days.push({ dayName, dateStr, dateNum: d.getDate(), didPractice });
    }
    return days;
  };

  const activityDays = getLast7Days();

  const toggleExpandSession = (id) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  // Format MongoDB date string
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="screen-container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '8px' }}>Mon Progrès</h2>
      <p className="section-sub" style={{ textAlign: 'left', marginBottom: '32px' }}>
        Track your learning statistics, daily streak, and practice history.
      </p>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Daily Streak</p>
              <p className="stat-value" style={{ color: 'var(--red)' }}>
                {streak} <span className="stat-sub" style={{ textTransform: 'lowercase' }}>jours</span>
              </p>
            </div>
            <div style={{ background: 'rgba(217,64,64,0.1)', padding: '8px', borderRadius: '8px', color: 'var(--red)' }}>
              <Flame size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Avg Fluency</p>
              <p className="stat-value" style={{ color: 'var(--gold)' }}>
                {avgScore}%
              </p>
            </div>
            <div style={{ background: 'rgba(201,168,76,0.1)', padding: '8px', borderRadius: '8px', color: 'var(--gold)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Vocab Learned</p>
              <p className="stat-value" style={{ color: 'var(--green)' }}>
                {vocabCount} <span className="stat-sub" style={{ textTransform: 'lowercase' }}>mots</span>
              </p>
            </div>
            <div style={{ background: 'rgba(76,175,122,0.1)', padding: '8px', borderRadius: '8px', color: 'var(--green)' }}>
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Sessions Played</p>
              <p className="stat-value" style={{ color: 'var(--amber)' }}>
                {totalSessions} <span className="stat-sub" style={{ textTransform: 'lowercase' }}>fois</span>
              </p>
            </div>
            <div style={{ background: 'rgba(232,160,48,0.1)', padding: '8px', borderRadius: '8px', color: 'var(--amber)' }}>
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Tracker */}
      <div className="stat-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <p className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Calendar size={16} /> Weekly Activity
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {activityDays.map((d, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>{d.dayName}</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: d.didPractice ? 'var(--gold-glow)' : 'rgba(240,230,200,0.02)',
                  border: d.didPractice ? '1px solid var(--gold)' : '1px solid rgba(240,230,200,0.05)',
                  color: d.didPractice ? 'var(--gold)' : 'var(--muted-dim)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  position: 'relative'
                }}
              >
                {d.dateNum}
                {d.didPractice && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      boxShadow: '0 0 8px var(--gold)'
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vocabulary Bank */}
      <div className="stat-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <p className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BookOpen size={16} /> Vocabulaire Appris
        </p>
        {vocabCount === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontStyle: 'italic', padding: '12px 0' }}>
            No vocabulary practiced yet. Start scanning images to build your vocabulary!
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '8px' }}>
            {vocabWords.map((word, index) => (
              <button
                key={index}
                onClick={() => speakWord(word)}
                className="tl-badge"
                style={{
                  cursor: 'pointer',
                  border: '1px solid rgba(240,230,200,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  background: 'rgba(240, 230, 200, 0.03)',
                  color: 'var(--cream)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.color = 'var(--gold)';
                  e.currentTarget.style.background = 'var(--gold-glow)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(240,230,200,0.08)';
                  e.currentTarget.style.color = 'var(--cream)';
                  e.currentTarget.style.background = 'rgba(240, 230, 200, 0.03)';
                }}
              >
                {word}
                <Volume2 size={13} style={{ opacity: 0.6 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session History */}
      <h3 className="timeline-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', marginBottom: '24px' }}>
        <Clock size={20} /> Historique des Sessions
      </h3>

      {loading && sessions.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>
          <span className="spinner" /> Loading session history...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          You have not completed any sessions yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions.map((session) => {
            const isExpanded = expandedSession === session._id;
            return (
              <div
                key={session._id}
                style={{
                  background: 'var(--card)',
                  border: isExpanded ? '1px solid var(--gold)' : '1px solid rgba(240, 230, 200, 0.05)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpandSession(session._id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                      {formatDate(session.createdAt)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--cream)' }}>
                        Session ({session.rounds?.length || 0} rounds)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                        Score
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--gold)', fontSize: '1.2rem' }}>
                        {session.averageScore || 0}%
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} color="var(--muted)" /> : <ChevronDown size={20} color="var(--muted)" />}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(240, 230, 200, 0.05)', background: 'rgba(240, 230, 200, 0.01)' }}>
                    {/* Words practiced in this session */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', borderBottom: '1px solid rgba(240, 230, 200, 0.03)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '600' }}>Words Focus:</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {session.words?.map((w, idx) => (
                          <span key={idx} className="tl-badge" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timeline of rounds */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                      {session.rounds?.map((round, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '16px',
                            background: 'rgba(240, 230, 200, 0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(240, 230, 200, 0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                              Round {index + 1}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: round.score > 80 ? 'var(--green)' : round.score > 60 ? 'var(--amber)' : 'var(--red)' }}>
                              Score: {round.score}%
                            </span>
                          </div>
                          
                          <p style={{ fontStyle: 'italic', color: 'var(--cream)', marginBottom: '4px', fontSize: '0.95rem' }}>
                            "{round.sentence}"
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>
                            {round.sentenceEn}
                          </p>
                          
                          <div style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '6px', borderLeft: '2px solid var(--gold)', color: 'var(--cream)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                              You said:
                            </p>
                            "{round.userText || '[No speech input]'}"
                          </div>

                          {round.feedback && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                              <Sparkles size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <span style={{ color: 'var(--muted)' }}>Feedback: </span>
                                <span style={{ color: 'var(--cream)' }}>{round.feedback}</span>
                                {round.tip && (
                                  <p style={{ color: 'var(--gold)', marginTop: '4px', fontSize: '0.8rem' }}>
                                    💡 Tip: {round.tip}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
