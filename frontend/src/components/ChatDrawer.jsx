import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Stethoscope, AlertTriangle, ArrowRight } from 'lucide-react';

const ChatDrawer = ({ isOpen, onClose, onSearchSpecialty, onBook }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Symptom Assistant. Describe your symptoms (e.g. 'I have had a throbbing earache and mild dizziness for 2 days') and I will help triage your condition and recommend the correct nearby specialist.",
      type: 'welcome'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [triageState, setTriageState] = useState({
    stage: 'initial',
    specialist: '',
    priority: '',
    analysis: '',
    answers: []
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (textVal) => {
    if (!textVal.trim() || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: textVal }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: textVal, 
          city: 'Bengaluru',
          stage: triageState.stage,
          specialist: triageState.specialist,
          priority: triageState.priority,
          analysis: triageState.analysis,
          answers: triageState.answers
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();

      if (data.stage === 'completed') {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: data.analysis,
          triage: {
            analysis: data.analysis,
            priority: data.priority,
            specialist: data.specialist,
            doctors: data.doctors || []
          }
        }]);
        // Reset state
        setTriageState({
          stage: 'initial',
          specialist: '',
          priority: '',
          analysis: '',
          answers: []
        });
      } else {
        // Triage in progress (asking dynamic questions)
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: data.questionText,
          options: data.options
        }]);
        setTriageState({
          stage: data.stage,
          specialist: data.specialist,
          priority: data.priority,
          analysis: data.analysis,
          answers: data.answers
        });
      }
    } catch (err) {
      console.warn('Backend API connection failed, using local fallback:', err.message);
      await new Promise(resolve => setTimeout(resolve, 1500));

      let triageData = {
        analysis: "Your symptoms point toward possible middle ear congestion or labyrinthitis, which often causes minor balance disturbances (dizziness).",
        priority: "Medium",
        specialist: "ENT Specialist",
        doctors: []
      };

      const lower = textVal.toLowerCase();
      if (lower.includes('chest') || lower.includes('heart') || lower.includes('breath') || lower.includes('cardio')) {
        triageData = {
          analysis: "Chest pressure, difficulty breathing, or erratic heart beats can indicate cardiorespiratory strain.",
          priority: "High",
          specialist: "Cardiologist",
          doctors: []
        };
      } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('allergy')) {
        triageData = {
          analysis: "Local epidermal flares, redness, or itching indicate common skin irritation or dermatitis.",
          priority: "Low",
          specialist: "Dermatologist",
          doctors: []
        };
      } else if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('swallow')) {
        triageData = {
          analysis: "Symptoms match standard ear, nose, or throat discomfort.",
          priority: "Medium",
          specialist: "ENT Specialist",
          doctors: []
        };
      } else if (lower.includes('tooth') || lower.includes('teeth') || lower.includes('gum') || lower.includes('dentist')) {
        triageData = {
          analysis: "Oral discomfort or sensitivity indicated. Dental checkup recommended.",
          priority: "Low",
          specialist: "Dentist",
          doctors: []
        };
      } else if (lower.includes('anxiety') || lower.includes('depression') || lower.includes('sleep') || lower.includes('stress') || lower.includes('mental')) {
        triageData = {
          analysis: "Stress, sleep disturbance, or mood flags detected. Consultation with a psychiatrist or counselor suggested.",
          priority: "Medium",
          specialist: "Psychiatrist",
          doctors: []
        };
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: triageData.analysis,
        triage: triageData
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        height: '520px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        boxShadow: '0 12px 40px rgba(6, 182, 212, 0.18)'
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '16px',
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stethoscope style={{ color: 'var(--primary-neon)' }} size={20} />
          <div>
            <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>AI Symptom Triage</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary-neon)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--secondary-neon)', display: 'inline-block' }} />
              Gemini 1.5 Engine Active
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Message Sequence Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          return (
            <div 
              key={index} 
              style={{
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div 
                style={{
                  background: isAi ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(90deg, var(--primary-neon), #0891b2)',
                  color: isAi ? 'var(--text-primary)' : '#fff',
                  padding: '12px',
                  borderRadius: isAi ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                  border: isAi ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}
              >
                {msg.text}

                {/* Quick replies options (rendered only on the latest message) */}
                {isAi && msg.options && msg.options.length > 0 && index === messages.length - 1 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {msg.options.map((option, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => sendMessage(option)}
                        disabled={isLoading}
                        style={{
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          borderRadius: '50px',
                          color: 'var(--primary-neon)',
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Triage Results Card */}
                {isAi && msg.triage && (
                  <div 
                    style={{
                      marginTop: '10px',
                      background: 'rgba(7, 9, 19, 0.65)',
                      borderRadius: '8px',
                      border: `1px solid ${
                        msg.triage.priority === 'High' ? 'var(--accent-alert)' :
                        msg.triage.priority === 'Medium' ? 'var(--accent-star)' : 'var(--secondary-neon)'
                      }`,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxWidth: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>PRIORITY:</span>
                      <span 
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#fff',
                          background: 
                            msg.triage.priority === 'High' ? 'var(--accent-alert)' :
                            msg.triage.priority === 'Medium' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          border: `1px solid ${
                            msg.triage.priority === 'High' ? 'var(--accent-alert)' :
                            msg.triage.priority === 'Medium' ? 'var(--accent-star)' : 'var(--secondary-neon)'
                          }`
                        }}
                      >
                        {msg.triage.priority.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#fff' }}>
                      <strong>Specialist:</strong> {msg.triage.specialist}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {msg.triage.analysis}
                    </div>

                    {/* Quick Skyscanner Trigger Action Link */}
                    <button 
                      onClick={() => {
                        onSearchSpecialty(msg.triage.specialist);
                        onClose();
                      }}
                      style={{
                        marginTop: '2px',
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        borderRadius: '6px',
                        color: 'var(--primary-neon)',
                        padding: '5px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      View on interactive map
                      <ArrowRight size={10} />
                    </button>

                    {/* 🛝 Doctor Carousel (Apollo Style) */}
                    {msg.triage.doctors && msg.triage.doctors.length > 0 && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', maxWidth: '100%' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                          🏥 Best Matches in Bengaluru:
                        </span>

                        <div 
                          style={{
                            display: 'flex',
                            gap: '10px',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            paddingBottom: '8px',
                            maxWidth: '100%'
                          }}
                          className="chat-carousel"
                        >
                          {msg.triage.doctors.map((doc, dIdx) => (
                            <div 
                              key={doc.doctorId || dIdx}
                              style={{
                                flex: '0 0 92%',
                                scrollSnapAlign: 'start',
                                background: 'rgba(7, 9, 19, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <strong style={{ fontSize: '0.78rem', color: '#fff', display: 'block' }}>Dr. {doc.name}</strong>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                                    {doc.experience} yrs exp • {doc.clinicName}
                                  </span>
                                </div>
                                {doc.scrapedRating && (
                                  <span style={{ fontSize: '0.68rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 5px', borderRadius: '4px' }}>
                                    ★ {doc.scrapedRating}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                <div>
                                  <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.8 }}>FEE</span>
                                  <strong style={{ color: '#fff' }}>₹{doc.fee}</strong>
                                </div>
                                <div>
                                  <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.8 }}>PROXIMITY</span>
                                  <strong style={{ color: '#fff' }}>{doc.distanceKm} km</strong>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onBook) {
                                    onBook(doc);
                                    onClose();
                                  }
                                }}
                                style={{
                                  background: 'linear-gradient(90deg, var(--secondary-neon), #059669)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  padding: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  width: '100%',
                                  transition: 'transform 0.1s',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                Book Consultation
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Pulsing Loading Indicators */}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.04)', padding: '12px', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-neon)', animation: 'pulseDot 1.2s infinite 0s' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-neon)', animation: 'pulseDot 1.2s infinite 0.2s' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-neon)', animation: 'pulseDot 1.2s infinite 0.4s' }} />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Console */}
      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe symptoms (e.g. fever, headache)..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '0.8rem',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            background: 'var(--primary-neon)',
            border: 'none',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          <Send size={14} />
        </button>
      </form>

      {/* Embedded CSS for dots pulse and scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        .chat-carousel::-webkit-scrollbar {
          height: 4px;
        }
        .chat-carousel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .chat-carousel::-webkit-scrollbar-thumb {
          background: var(--primary-neon, #06b6d4);
          border-radius: 4px;
        }
      `}} />
    </div>
  );
};

export default ChatDrawer;
