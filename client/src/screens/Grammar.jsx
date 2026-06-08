import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { playNativeAudio } from '../utils/audio';
import { Search, Volume2, Sparkles, CheckCircle, XCircle, RotateCcw, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';

export default function Grammar({ showToast }) {
  const { getApi, loading } = useApi(showToast);
  
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWord, setSelectedWord] = useState(null);
  
  // Quiz State
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  // Load user from localStorage
  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  // Fetch words on mount
  useEffect(() => {
    async function loadWords() {
      if (!user?._id) return;
      const data = await getApi(`/api/words?userId=${user._id}`);
      if (data) {
        setWords(data);
        if (data.length > 0) {
          setSelectedWord(data[0]);
        }
      }
    }
    loadWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset quiz when the selected word changes
  useEffect(() => {
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
  }, [selectedWord]);

  // Extract unique categories (parts of speech)
  const categories = ['All', ...new Set(words.map(w => {
    const pos = w.partOfSpeech || 'noun';
    // Capitalize first letter
    return pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
  }))];

  // Filter words
  const filteredWords = words.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.definition.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const normalizedPOS = (item.partOfSpeech || 'noun').toLowerCase();
    const matchesCategory = selectedCategory === 'All' || 
                            normalizedPOS === selectedCategory.toLowerCase();
                            
    return matchesSearch && matchesCategory;
  });

  // Keep selected word in sync with filtered list
  useEffect(() => {
    if (filteredWords.length > 0 && !filteredWords.some(w => w._id === selectedWord?._id)) {
      setSelectedWord(filteredWords[0]);
    } else if (filteredWords.length === 0) {
      setSelectedWord(null);
    }
  }, [filteredWords, selectedWord]);

  const handleSpeak = (text) => {
    playNativeAudio(text).catch(err => {
      console.error(err);
      showToast('Error playing audio.');
    });
  };

  const handleQuizSubmit = (option) => {
    if (quizAnswered) return;
    setSelectedOption(option);
    const isCorrect = option === selectedWord.quiz.answer;
    setQuizCorrect(isCorrect);
    setQuizAnswered(true);
    
    if (isCorrect) {
      showToast('Excellent! Bonne réponse!');
    } else {
      showToast('Oups! Try again.');
    }
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
  };

  const getPOSColor = (pos) => {
    const cleanPOS = (pos || 'noun').toLowerCase();
    if (cleanPOS.includes('noun')) return 'var(--gold)';
    if (cleanPOS.includes('verb')) return 'var(--green)';
    if (cleanPOS.includes('adject')) return 'var(--amber)';
    if (cleanPOS.includes('adverb')) return '#9b5de5';
    return 'var(--muted)';
  };

  const formatIndex = (idx) => {
    const num = idx + 1;
    if (num < 10) return `#00${num}`;
    if (num < 100) return `#0${num}`;
    return `#${num}`;
  };

  return (
    <div className="screen-container" style={{ maxWidth: '1000px', width: '100%', paddingTop: '20px', paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '4px' }}>Pokédex de Vocabulaire</h2>
        <p className="section-sub" style={{ textAlign: 'left', marginBottom: '16px' }}>
          Your dynamic vocabulary book. Scan images to add words, listen to native pronunciations, and complete quizzes.
        </p>
      </div>

      {loading && words.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px' }}>
          <span className="spinner" /> Loading your vocabulary portfolio...
        </div>
      ) : words.length === 0 ? (
        /* Empty State Onboarding */
        <div style={{ background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '60px 40px', textAlign: 'center', color: 'var(--muted)', maxWidth: '560px', margin: '40px auto' }}>
          <div style={{ background: 'var(--gold-glow)', color: 'var(--gold)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <BookOpen size={28} />
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '12px' }}>
            Votre Pokédex est vide
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--muted)', marginBottom: '32px' }}>
            You haven't scanned any images yet! Go to the home screen, drag and drop an image containing French text, and we will automatically enrich and save the words here.
          </p>
          <a
            href="/"
            className="btn-primary"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              margin: '0 auto'
            }}
          >
            Scan an Image <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <>
          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search vocabulary by word, translation, or definition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(240, 230, 200, 0.08)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontFamily: 'var(--sans)',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginRight: '6px' }}>Part of Speech:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: selectedCategory === cat ? '1px solid var(--gold)' : '1px solid rgba(240, 230, 200, 0.05)',
                      background: selectedCategory === cat ? 'var(--gold-glow)' : 'rgba(240, 230, 200, 0.02)',
                      color: selectedCategory === cat ? 'var(--gold)' : 'var(--muted)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat === 'All' ? 'Toutes' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid / Split Layout */}
          {filteredWords.length === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '60px 40px', textAlign: 'center', color: 'var(--muted)' }}>
              <HelpCircle size={40} style={{ color: 'var(--muted-dim)', marginBottom: '16px' }} />
              <p>No words found matching your filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                style={{
                  marginTop: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Word Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '720px', overflowY: 'auto', paddingRight: '8px' }}>
                {filteredWords.map((item, index) => {
                  const isSelected = selectedWord?._id === item._id;
                  const pos = item.partOfSpeech || 'noun';
                  const accentColor = getPOSColor(pos);
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedWord(item)}
                      style={{
                        background: 'var(--card)',
                        border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(240, 230, 200, 0.05)',
                        borderRadius: 'var(--radius)',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        transform: isSelected ? 'translateX(4px)' : 'none',
                        boxShadow: isSelected ? `0 4px 20px rgba(0,0,0,0.4), 0 0 10px ${accentColor}33` : 'none'
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(240,230,200,0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(240, 230, 200, 0.05)';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: '500' }}>
                          {formatIndex(words.indexOf(item))}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: `${accentColor}15`, color: accentColor }}>
                          {pos.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', color: 'var(--cream)', marginBottom: '4px' }}>
                        {item.word}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {item.translation}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Pokedex Details Panel */}
              {selectedWord && (
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid rgba(240, 230, 200, 0.08)',
                    borderRadius: 'var(--radius)',
                    padding: '32px',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
                    position: 'sticky',
                    top: '20px'
                  }}
                >
                  {/* Top Header Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid rgba(240, 230, 200, 0.05)', paddingBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: '4px' }}>
                        Pokedex Entry {formatIndex(words.indexOf(selectedWord))}
                      </span>
                      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--cream)', textTransform: 'capitalize' }}>
                        {selectedWord.word}
                      </h3>
                      <p style={{ fontSize: '0.95rem', color: 'var(--gold)', fontStyle: 'italic', marginTop: '2px' }}>
                        {selectedWord.translation}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: `${getPOSColor(selectedWord.partOfSpeech)}15`,
                        color: getPOSColor(selectedWord.partOfSpeech),
                        border: `1px solid ${getPOSColor(selectedWord.partOfSpeech)}33`
                      }}
                    >
                      {(selectedWord.partOfSpeech || 'vocab').toUpperCase()}
                    </span>
                  </div>

                  {/* Definition */}
                  <div style={{ marginBottom: '28px' }}>
                    <p className="stat-label" style={{ marginBottom: '8px', fontSize: '0.75rem' }}>Définition</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--cream)' }}>
                      {selectedWord.definition}
                    </p>
                  </div>

                  {/* Examples Section */}
                  {selectedWord.examples && selectedWord.examples.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                      <p className="stat-label" style={{ marginBottom: '12px', fontSize: '0.75rem' }}>Exemples d'Usage (Hear Pronunciation)</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedWord.examples.map((example, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSpeak(example.textFr)}
                            style={{
                              padding: '14px 16px',
                              background: 'rgba(240, 230, 200, 0.02)',
                              border: '1px solid rgba(240, 230, 200, 0.03)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(201, 168, 76, 0.04)';
                              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.2)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(240, 230, 200, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(240, 230, 200, 0.03)';
                            }}
                          >
                            <div style={{ paddingRight: '12px' }}>
                              <p style={{ fontWeight: '500', color: 'var(--cream)', fontSize: '0.95rem', marginBottom: '4px' }}>
                                "{example.textFr}"
                              </p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                                {example.textEn}
                              </p>
                            </div>
                            <Volume2 size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Quiz Module */}
                  {selectedWord.quiz && selectedWord.quiz.question && (
                    <div style={{ borderTop: '1px solid rgba(240, 230, 200, 0.08)', paddingTop: '24px' }}>
                      <p className="stat-label" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <Sparkles size={14} color="var(--gold)" /> Vocabulary Challenge
                      </p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--cream)', marginBottom: '16px' }}>
                        {selectedWord.quiz.question}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                        {selectedWord.quiz.options?.map((option, idx) => {
                          const isOptionSelected = selectedOption === option;
                          const isCorrectAnswer = option === selectedWord.quiz.answer;
                          
                          let cardStyle = {
                            padding: '12px',
                            background: 'rgba(240, 230, 200, 0.02)',
                            border: '1px solid rgba(240, 230, 200, 0.05)',
                            borderRadius: '6px',
                            color: 'var(--cream)',
                            fontFamily: 'var(--sans)',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            cursor: quizAnswered ? 'default' : 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            borderStyle: 'solid'
                          };

                          if (quizAnswered) {
                            if (isCorrectAnswer) {
                              cardStyle.background = 'rgba(76, 175, 122, 0.15)';
                              cardStyle.border = '1px solid var(--green)';
                              cardStyle.color = 'var(--green)';
                            } else if (isOptionSelected) {
                              cardStyle.background = 'rgba(217, 64, 64, 0.15)';
                              cardStyle.border = '1px solid var(--red)';
                              cardStyle.color = 'var(--red)';
                            } else {
                              cardStyle.opacity = 0.5;
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={quizAnswered}
                              onClick={() => handleQuizSubmit(option)}
                              style={cardStyle}
                              onMouseOver={(e) => {
                                if (!quizAnswered) {
                                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.08)';
                                  e.currentTarget.style.borderColor = 'var(--gold)';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!quizAnswered) {
                                  e.currentTarget.style.background = 'rgba(240, 230, 200, 0.02)';
                                  e.currentTarget.style.borderColor = 'rgba(240, 230, 200, 0.05)';
                                }
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Explanation */}
                      {quizAnswered && (
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '6px',
                            background: quizCorrect ? 'rgba(76, 175, 122, 0.05)' : 'rgba(217, 64, 64, 0.03)',
                            border: quizCorrect ? '1px solid rgba(76, 175, 122, 0.2)' : '1px solid rgba(217, 64, 64, 0.15)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600' }}>
                            {quizCorrect ? (
                              <><CheckCircle size={16} color="var(--green)" /> <span style={{ color: 'var(--green)' }}>Correct !</span></>
                            ) : (
                              <><XCircle size={16} color="var(--red)" /> <span style={{ color: 'var(--red)' }}>Incorrect</span></>
                            )}
                          </div>
                          <p style={{ color: 'var(--cream)', lineHeight: '1.4', marginBottom: '12px' }}>
                            {selectedWord.quiz.explanation}
                          </p>
                          <button
                            onClick={handleResetQuiz}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--gold)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <RotateCcw size={12} /> Try Quiz Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
}
