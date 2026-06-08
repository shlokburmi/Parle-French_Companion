import { useState, useEffect } from 'react';
import { grammarData } from '../data/grammarData';
import { Search, Volume2, Sparkles, CheckCircle, XCircle, RotateCcw, BookOpen, HelpCircle } from 'lucide-react';

export default function Grammar({ showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedConcept, setSelectedConcept] = useState(grammarData[0]);
  
  // Quiz State
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  // Reset quiz when the selected concept changes
  useEffect(() => {
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
  }, [selectedConcept]);

  // Filter grammar concepts based on search, level, and category
  const filteredConcepts = grammarData.filter(concept => {
    const matchesSearch = concept.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          concept.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          concept.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || concept.level === selectedLevel;
    const matchesCategory = selectedCategory === 'All' || concept.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  // Make sure selectedConcept is still in the filtered list, if not, set to first filtered
  useEffect(() => {
    if (filteredConcepts.length > 0 && !filteredConcepts.some(c => c.id === selectedConcept?.id)) {
      setSelectedConcept(filteredConcepts[0]);
    }
  }, [filteredConcepts, selectedConcept]);

  // Text-To-Speech implementation
  const speakFrench = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9; // Slightly slower for language learners
      
      // Try to find a French voice if available
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Text-to-speech not supported in this browser.');
    }
  };

  const handleQuizSubmit = (option) => {
    if (quizAnswered) return; // Can't change answer
    setSelectedOption(option);
    const isCorrect = option === selectedConcept.quiz.answer;
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

  // Get color accents based on category
  const getCategoryColor = (category) => {
    switch(category) {
      case 'Verbs': return 'var(--gold)';
      case 'Articles': return 'var(--green)';
      case 'Pronouns': return 'var(--amber)';
      case 'Prepositions': return '#9b5de5';
      default: return 'var(--muted)';
    }
  };

  return (
    <div className="screen-container" style={{ maxWidth: '1000px', width: '100%', paddingTop: '20px', paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '4px' }}>Bibliothèque de Grammaire</h2>
        <p className="section-sub" style={{ textAlign: 'left', marginBottom: '16px' }}>
          Explore key grammatical concepts of French. Study conjugations, hear examples, and test yourself!
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Rechercher des règles de grammaire (e.g., passé, présent, pronom)..."
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>Niveau:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'A1', 'A2', 'B1', 'B2'].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selectedLevel === level ? '1px solid var(--gold)' : '1px solid rgba(240, 230, 200, 0.05)',
                    background: selectedLevel === level ? 'var(--gold-glow)' : 'rgba(240, 230, 200, 0.02)',
                    color: selectedLevel === level ? 'var(--gold)' : 'var(--muted)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>Catégorie:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Verbs', 'Articles', 'Pronouns'].map(cat => (
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
      </div>

      {/* Main Split Layout */}
      {filteredConcepts.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(240, 230, 200, 0.05)', borderRadius: 'var(--radius)', padding: '60px 40px', textAlign: 'center', color: 'var(--muted)' }}>
          <HelpCircle size={40} style={{ color: 'var(--muted-dim)', marginBottom: '16px' }} />
          <p>Aucun concept ne correspond à votre recherche.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedLevel('All'); setSelectedCategory('All'); }}
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
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Pokedex Card Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '720px', overflowY: 'auto', paddingRight: '8px' }}>
            {filteredConcepts.map((concept) => {
              const isSelected = selectedConcept?.id === concept.id;
              const accentColor = getCategoryColor(concept.category);
              return (
                <div
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: '500' }}>
                      {concept.id}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(240,230,200,0.1)', color: 'var(--cream)' }}>
                        {concept.level}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: `${accentColor}15`, color: accentColor }}>
                        {concept.category}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '4px' }}>
                    {concept.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {concept.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pokedex Detail Panel */}
          {selectedConcept && (
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
              {/* Top Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid rgba(240, 230, 200, 0.05)', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: '4px' }}>
                    Grammar Entry {selectedConcept.id}
                  </span>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', color: 'var(--cream)' }}>
                    {selectedConcept.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--gold)', fontStyle: 'italic' }}>
                    {selectedConcept.subtitle}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--gold)', color: 'var(--gold)', background: 'var(--gold-glow)' }}>
                    Level {selectedConcept.level}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                    {selectedConcept.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--cream)' }}>
                  {selectedConcept.description}
                </p>
              </div>

              {/* Conjugations / Structure Table */}
              {selectedConcept.conjugations && (
                <div style={{ marginBottom: '32px' }}>
                  <p className="stat-label" style={{ marginBottom: '12px', fontSize: '0.75rem' }}>Structure / Conjugaison</p>
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(240,230,200,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(240, 230, 200, 0.03)', borderBottom: '1px solid rgba(240, 230, 200, 0.08)' }}>
                          {selectedConcept.conjugations.headers.map((h, i) => (
                            <th key={i} style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gold)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedConcept.conjugations.rows.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: rIdx === selectedConcept.conjugations.rows.length - 1 ? 'none' : '1px solid rgba(240, 230, 200, 0.03)' }}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                style={{
                                  padding: '12px 16px',
                                  color: cIdx === 0 ? 'var(--muted)' : 'var(--cream)',
                                  fontWeight: cIdx === 0 ? '500' : 'normal',
                                  fontFamily: cIdx > 0 ? 'var(--sans)' : 'inherit'
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Examples with Audio */}
              <div style={{ marginBottom: '32px' }}>
                <p className="stat-label" style={{ marginBottom: '12px', fontSize: '0.75rem' }}>Exemples d'Usage (Hear it)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedConcept.examples.map((example, idx) => (
                    <div
                      key={idx}
                      onClick={() => speakFrench(example.textFr)}
                      style={{
                        padding: '12px 16px',
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
                        <p style={{ fontWeight: '500', color: 'var(--cream)', fontSize: '0.95rem', marginBottom: '2px' }}>
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

              {/* Quiz Module */}
              {selectedConcept.quiz && (
                <div style={{ borderTop: '1px solid rgba(240, 230, 200, 0.08)', paddingTop: '24px' }}>
                  <p className="stat-label" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Sparkles size={14} color="var(--gold)" /> Mini Challenge
                  </p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--cream)', marginBottom: '16px' }}>
                    {selectedConcept.quiz.question}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {selectedConcept.quiz.options.map((option, idx) => {
                      const isOptionSelected = selectedOption === option;
                      const isCorrectAnswer = option === selectedConcept.quiz.answer;
                      
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
                        transition: 'all 0.2s ease'
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
                      } else {
                        // Hover interactions handled dynamically in render via mouse events
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
                        {selectedConcept.quiz.explanation}
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
                        <RotateCcw size={12} /> Réessayer le quiz
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
