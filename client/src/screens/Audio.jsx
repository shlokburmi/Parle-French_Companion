import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { playNativeAudio } from '../utils/audio';
import { Play, Pause, RotateCcw, Volume2, Mic, Eye, EyeOff, Sparkles, ChevronLeft, Headphones, Award } from 'lucide-react';

const episodes = [
  {
    id: "ep1",
    title: "Au Café Parisien",
    level: "A1",
    duration: "1:15",
    description: "Learn how to order food, coffees, and pastries at a traditional café in Paris. Perfect for beginners starting real-world interactions.",
    dialogue: [
      { character: "Serveur", textFr: "Bonjour, messieurs-dames ! Vous désirez ?", textEn: "Hello, ladies and gentlemen! What would you like?" },
      { character: "Marc", textFr: "Bonjour ! Je voudrais un café au lait et un croissant, s'il vous plaît.", textEn: "Hello! I would like a coffee with milk and a croissant, please." },
      { character: "Sophie", textFr: "Et pour moi, un jus d'orange pressé et une tartelette aux fraises.", textEn: "And for me, a freshly squeezed orange juice and a small strawberry tart." },
      { character: "Serveur", textFr: "Très bien. Un café au lait, un croissant, un jus d'orange et une tartelette. Autre chose ?", textEn: "Very well. A coffee with milk, a croissant, an orange juice, and a tart. Anything else?" },
      { character: "Marc", textFr: "Non, c'est tout, merci. L'addition, s'il vous plaît !", textEn: "No, that's all, thank you. The bill, please!" },
      { character: "Serveur", textFr: "Tout de suite. Ça fait douze euros cinquante, s'il vous plaît.", textEn: "Right away. That makes twelve euros fifty, please." }
    ]
  },
  {
    id: "ep2",
    title: "Perdu dans le Métro",
    level: "A2",
    duration: "1:40",
    description: "Navigate the Paris underground. Learn to ask for directions, purchase tickets, and find the right train line.",
    dialogue: [
      { character: "Lucas", textFr: "Excusez-moi, madame. Savez-vous comment aller à la station Châtelet ?", textEn: "Excuse me, ma'am. Do you know how to get to Châtelet station?" },
      { character: "Passante", textFr: "Oui, bien sûr. Prenez la ligne quatre en direction de Porte de Clignancourt.", textEn: "Yes, of course. Take line four in the direction of Porte de Clignancourt." },
      { character: "Lucas", textFr: "D'accord. Est-ce que je dois changer de train ou c'est direct ?", textEn: "Okay. Do I need to change trains or is it direct?" },
      { character: "Passante", textFr: "C'est direct. Il y a environ six stations jusqu'à Châtelet.", textEn: "It is direct. There are about six stations to Châtelet." },
      { character: "Lucas", textFr: "Super ! Où puis-je acheter un ticket de métro ?", textEn: "Great! Where can I buy a metro ticket?" },
      { character: "Passante", textFr: "Aux bornes automatiques, juste là-bas à l'entrée. Bon voyage !", textEn: "At the automatic machines, just over there at the entrance. Have a good trip!" }
    ]
  },
  {
    id: "ep3",
    title: "La Routine Quotidienne",
    level: "B1",
    duration: "2:10",
    description: "Listen to a casual discussion between friends about their everyday life, work-life balance, and weekend plans in the city.",
    dialogue: [
      { character: "Thomas", textFr: "Salut Julie ! Ça va ? Tu as l'air un peu fatiguée aujourd'hui.", textEn: "Hi Julie! How are you? You look a bit tired today." },
      { character: "Julie", textFr: "Salut Thomas. Oui, c'est vrai. Je me lève à six heures tous les matins en ce moment.", textEn: "Hi Thomas. Yes, it's true. I wake up at six o'clock every morning lately." },
      { character: "Thomas", textFr: "Ah bon ? Pourquoi si tôt ? Tu commences le travail à quelle heure ?", textEn: "Oh really? Why so early? What time do you start work?" },
      { character: "Julie", textFr: "Je commence à huit heures, mais j'ai une heure et demie de transports en commun.", textEn: "I start at eight, but I have an hour and a half of public transportation." },
      { character: "Thomas", textFr: "C'est difficile. Tu devrais te détendre ce week-end. Qu'est-ce que tu as prévu ?", textEn: "That's hard. You should relax this weekend. What do you have planned?" },
      { character: "Julie", textFr: "Je vais faire une grasse matinée samedi, puis me promener au parc du Luxembourg.", textEn: "Julie is going to sleep in on Saturday, then take a walk in the Luxembourg garden." }
    ]
  },
  {
    id: "ep4",
    title: "L'Entretien d'Embauche",
    level: "B2",
    duration: "2:45",
    description: "A formal job interview simulation. Practice advanced speaking, professional expressions, and formal speech styles.",
    dialogue: [
      { character: "Recruteur", textFr: "Bonjour. Installez-vous. Parlez-moi de votre parcours professionnel.", textEn: "Hello. Take a seat. Tell me about your professional background." },
      { character: "Candidat", textFr: "Bonjour. J'ai travaillé pendant trois ans comme chef de projet marketing à Lyon.", textEn: "Hello. I worked for three years as a marketing project manager in Lyon." },
      { character: "Recruteur", textFr: "Très bien. Quelles compétences pensez-vous apporter à notre équipe ?", textEn: "Very well. What skills do you think you would bring to our team?" },
      { character: "Candidat", textFr: "Je maîtrise la gestion de budget et je sais coordonner des projets internationaux.", textEn: "I am proficient in budget management and I know how to coordinate international projects." },
      { character: "Recruteur", textFr: "Pourquoi souhaitez-vous rejoindre notre entreprise en particulier ?", textEn: "Why do you want to join our company in particular?" },
      { character: "Candidat", textFr: "Votre entreprise a une excellente réputation en matière d'innovation technologique.", textEn: "Your company has an excellent reputation for technological innovation." },
      { character: "Recruteur", textFr: "Parfait. Nous vous recontacterons d'ici la fin de la semaine.", textEn: "Perfect. We will get back to you by the end of the week." }
    ]
  }
];

export default function AudioScreen({ showToast }) {
  const [selectedEp, setSelectedEp] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [showTranslations, setShowTranslations] = useState({});
  const [practiceLineIdx, setPracticeLineIdx] = useState(null);
  
  // Pronunciation Evaluation State
  const [speechMatchScore, setSpeechMatchScore] = useState(null);
  const [evaluatingSpeech, setEvaluatingSpeech] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const { supported, isRecording, transcript, error, startListening, stopListening } = useSpeechRecognition();

  // Reset state when changing episodes
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentLine(0);
    setPracticeLineIdx(null);
    setSpeechMatchScore(null);
    setShowTranslations({});
  }, [selectedEp]);

  // Handle SpeechRecognition output for repeat-after-me challenge
  useEffect(() => {
    if (transcript && practiceLineIdx !== null) {
      evaluatePronunciation(transcript, selectedEp.dialogue[practiceLineIdx].textFr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Scroll to active line in player
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(`.line-item-active`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentLine, isPlaying]);

  // Clean strings and calculate word-level similarity
  const evaluatePronunciation = (spoken, target) => {
    setEvaluatingSpeech(true);
    
    const cleanStr = (s) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g, "").replace(/\s+/g, " ").trim();
    const sSpoken = cleanStr(spoken);
    const sTarget = cleanStr(target);

    if (!sSpoken || !sTarget) {
      setSpeechMatchScore({ score: 0, spokenText: spoken });
      setEvaluatingSpeech(false);
      return;
    }

    const wordsSpoken = sSpoken.split(" ");
    const wordsTarget = sTarget.split(" ");

    // Calculate count of words matching
    let matches = 0;
    wordsSpoken.forEach(w => {
      if (wordsTarget.includes(w)) {
        matches += 1;
      }
    });

    const finalScore = Math.round((matches / Math.max(wordsSpoken.length, wordsTarget.length)) * 100);
    setSpeechMatchScore({
      score: Math.min(100, Math.max(10, finalScore)),
      spokenText: spoken
    });
    setEvaluatingSpeech(false);
  };

  // Speak a single line
  const speakLine = (text, onEndCallback) => {
    playNativeAudio(text, speed).then(() => {
      if (onEndCallback) onEndCallback();
    }).catch(err => {
      console.error('[Audio play error]', err);
      setIsPlaying(false);
    });
  };

  // Autoplay loop through the dialogue lines
  useEffect(() => {
    if (!isPlaying || !selectedEp) return;

    const runLoop = () => {
      const line = selectedEp.dialogue[currentLine];
      if (!line) {
        setIsPlaying(false);
        return;
      }

      speakLine(line.textFr, () => {
        // Pause briefly between character turns
        setTimeout(() => {
          setCurrentLine(prev => {
            const nextIdx = prev + 1;
            if (nextIdx >= selectedEp.dialogue.length) {
              setIsPlaying(false);
              return 0; // reset to start when finished
            }
            return nextIdx;
          });
        }, 1200);
      });
    };

    runLoop();
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentLine, selectedEp, speed]);

  const handlePlayPause = () => {
    if (isPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentLine(0);
  };

  const toggleTranslation = (idx) => {
    setShowTranslations(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleStartPractice = (idx) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setPracticeLineIdx(idx);
    setSpeechMatchScore(null);
    startListening();
  };

  const handleStopPractice = () => {
    stopListening();
  };

  return (
    <div className="screen-container" style={{ maxWidth: selectedEp ? '780px' : 'var(--max-w)', width: '100%', paddingTop: '20px', paddingBottom: '60px' }}>
      
      {!selectedEp ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '4px' }}>Immersion Audio</h2>
            <p className="section-sub" style={{ textAlign: 'left', marginBottom: '8px' }}>
              Practice listening comprehension and spoken replication with interactive storylines.
            </p>
          </div>

          {/* Episode Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {episodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => setSelectedEp(ep)}
                className="stat-card"
                style={{
                  padding: '28px',
                  cursor: 'pointer',
                  border: '1px solid rgba(240, 230, 200, 0.05)',
                  transition: 'all 0.25s ease'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--gold-glow)', color: 'var(--gold)', padding: '8px', borderRadius: '8px' }}>
                      <Headphones size={20} />
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '1.25rem', fontFamily: 'var(--serif)', color: 'var(--cream)' }}>
                      {ep.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '4px' }}>
                      {ep.level}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(240,230,200,0.04)', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                      {ep.duration} mins
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.5', margin: 0 }}>
                  {ep.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Dialogue Player Panel */
        <div>
          {/* Back Button */}
          <button
            onClick={() => setSelectedEp(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--sans)',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '28px',
              padding: '8px 0'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <ChevronLeft size={16} /> Retour aux épisodes
          </button>

          {/* Episode Banner */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(240,230,200,0.06)',
              borderRadius: 'var(--radius)',
              padding: '24px 32px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
                  Épisode {selectedEp.id === 'ep1' ? '1' : selectedEp.id === 'ep2' ? '2' : selectedEp.id === 'ep3' ? '3' : '4'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(240,230,200,0.03)', padding: '3px 8px', borderRadius: '4px' }}>
                  Niveau {selectedEp.level}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--cream)' }}>
                {selectedEp.title}
              </h3>
            </div>
            
            {/* Speed Controller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(240,230,200,0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginRight: '6px' }}>Vitesse:</span>
              {[0.8, 1.0, 1.2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: speed === s ? 'var(--gold)' : 'none',
                    border: 'none',
                    color: speed === s ? 'var(--bg)' : 'var(--muted)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div
            ref={scrollContainerRef}
            style={{
              maxHeight: '460px',
              overflowY: 'auto',
              background: 'var(--card)',
              border: '1px solid rgba(240, 230, 200, 0.05)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '28px'
            }}
          >
            {selectedEp.dialogue.map((line, idx) => {
              const isActive = isPlaying && currentLine === idx;
              const showEn = showTranslations[idx];
              
              return (
                <div
                  key={idx}
                  className={isActive ? "line-item-active" : ""}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'rgba(240, 230, 200, 0.01)',
                    borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                    border: isActive ? '1px solid rgba(201, 168, 76, 0.15)' : '1px solid rgba(240, 230, 200, 0.02)',
                    transition: 'all 0.3s ease',
                    opacity: isPlaying && !isActive ? 0.45 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isActive ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--mono)' }}>
                      {line.character}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {/* Translation Toggle */}
                      <button
                        onClick={() => toggleTranslation(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}
                        title="Traduire"
                      >
                        {showEn ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      
                      {/* Individual Audio Speak */}
                      <button
                        onClick={() => speakLine(line.textFr)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}
                        title="Écouter"
                      >
                        <Volume2 size={14} />
                      </button>

                      {/* Microphone Pronunciation Challenge */}
                      <button
                        onClick={() => handleStartPractice(idx)}
                        style={{ background: 'none', border: 'none', color: practiceLineIdx === idx && isRecording ? 'var(--red)' : 'var(--muted)', cursor: 'pointer', padding: '2px' }}
                        title="S'entraîner"
                      >
                        <Mic size={14} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontWeight: '500', color: 'var(--cream)', fontSize: '1.05rem', margin: 0 }}>
                    {line.textFr}
                  </p>

                  {showEn && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '6px', marginBottom: 0 }}>
                      {line.textEn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pronunciation Practice Dialog overlay */}
          {practiceLineIdx !== null && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(240,230,200,0.1)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                animation: 'fadeUp 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> Pronunciation Challenge
                </span>
                <button
                  onClick={() => setPracticeLineIdx(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  Fermer
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>Target sentence:</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--cream)', marginBottom: '20px', borderLeft: '2px solid var(--gold)', paddingLeft: '12px' }}>
                "{selectedEp.dialogue[practiceLineIdx].textFr}"
              </p>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {isRecording ? (
                  <button
                    onClick={handleStopPractice}
                    className="btn-primary"
                    style={{ background: 'var(--red)', color: 'white', margin: 0, padding: '12px 24px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span className="bar" style={{ width: '4px', height: '12px', background: 'white', display: 'inline-block', animation: 'equalize 0.8s infinite alternate' }} />
                    Listening... Click to Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartPractice(practiceLineIdx)}
                    className="btn-primary"
                    style={{ margin: 0, padding: '12px 24px', minWidth: 'auto' }}
                  >
                    <Mic size={16} /> Tap to Record
                  </button>
                )}

                {supported === false && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--red)' }}>Microphone transcription is not supported in this browser.</span>
                )}
              </div>

              {/* Practice evaluation result */}
              {evaluatingSpeech && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '16px' }}><span className="spinner" /> Evaluating your pitch...</p>
              )}

              {speechMatchScore && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(240,230,200,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Award size={18} color="var(--gold)" />
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Match Accuracy:</span>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: speechMatchScore.score > 80 ? 'var(--green)' : speechMatchScore.score > 50 ? 'var(--gold)' : 'var(--red)' }}>
                      {speechMatchScore.score}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                    Browser understood:
                  </p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--cream)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                    "{speechMatchScore.spokenText || '[No speech detected]'}"
                  </p>

                  <p style={{ fontSize: '0.85rem', color: speechMatchScore.score > 80 ? 'var(--green)' : 'var(--muted)', marginTop: '8px' }}>
                    {speechMatchScore.score > 80 ? '✓ Excellent pronunciation! Keep it up!' : '💡 Try to speak slowly, articulate every syllable, and repeat.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Control Bar */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(240, 230, 200, 0.05)',
              borderRadius: 'var(--radius)',
              padding: '20px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handlePlayPause}
                className="btn-primary"
                style={{
                  margin: 0,
                  minWidth: '140px',
                  padding: '12px 24px',
                  background: isPlaying ? 'rgba(201, 168, 76, 0.1)' : 'var(--gold)',
                  border: isPlaying ? '1px solid var(--gold)' : 'none',
                  color: isPlaying ? 'var(--gold)' : 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Autoplay</>}
              </button>
              
              <button
                onClick={handleReset}
                className="btn-primary"
                style={{
                  margin: 0,
                  minWidth: 'auto',
                  padding: '12px 18px',
                  background: 'none',
                  border: '1px solid rgba(240, 230, 200, 0.1)',
                  color: 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={16} /> Recommencer
              </button>
            </div>

            <div style={{ textRendering: 'optimizeLegibility', textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Progression
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: '600', fontFamily: 'var(--mono)' }}>
                Ligne {isPlaying ? currentLine + 1 : 0} sur {selectedEp.dialogue.length}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
