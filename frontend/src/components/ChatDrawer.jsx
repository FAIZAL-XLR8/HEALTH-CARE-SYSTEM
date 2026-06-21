import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Stethoscope, AlertTriangle, ArrowRight, Star, MapPin, Calendar } from 'lucide-react';

const ChatDrawer = ({ isOpen, onClose, onSearchSpecialty, onBook }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your Apollo-style AI Symptom Assistant. Describe your symptoms (e.g. 'I have had a throbbing headache and mild fever for 2 days') and I will ask follow-up questions to understand your case, triage severity, and suggest the right specialists and doctors.",
      type: 'welcome'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isRagActive, setIsRagActive] = useState(true);
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

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    
    // Optimistically update message list with user query
    const updatedMessages = [...messages, { sender: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setIsLoading(true);
    setSelectedOptions([]); // Clear selection state

    try {
      // POST chat history to backend chatbot endpoint
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        throw new Error("Chatbot API returned error status.");
      }

      const data = await response.json();
      setIsRagActive(!!data.isRagUsed);

      // Log to browser developer console if RAG was used
      if (data.isRagUsed) {
        console.log("🤖 [Apollo Assist RAG] Chatbot query parsed using Retrieval-Augmented Generation (RAG) context.");
        console.log("- Context retrieval status: ACTIVE");
      } else {
        console.log("⚠️ [Apollo Assist RAG] Chatbot query parsed without RAG context fallback.");
      }
      
      // Update state with AI response, including triage & recommended doctors
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.text,
        isComplete: data.isComplete,
        options: data.options || [],
        optionsType: data.optionsType || 'single',
        triage: data.isComplete ? {
          analysis: data.triageAnalysis,
          priority: data.priority,
          specialist: data.specialty,
          followUp: data.followUpInstructions
        } : null,
        doctors: data.doctors || []
      }]);

    } catch (err) {
      console.error("❌ Chatbot UI request failed:", err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "I encountered an error connecting to the medical AI engine. Please verify your connection or try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const handleToggleOption = (opt) => {
    const isNone = opt.toLowerCase().includes('none');
    setSelectedOptions(prev => {
      if (isNone) {
        return prev.includes(opt) ? [] : [opt];
      } else {
        const filtered = prev.filter(item => !item.toLowerCase().includes('none'));
        if (filtered.includes(opt)) {
          return filtered.filter(item => item !== opt);
        } else {
          return [...filtered, opt];
        }
      }
    });
  };

  const handleConfirmMultiSelect = () => {
    if (selectedOptions.length === 0) return;
    const textToSend = selectedOptions.join(', ');
    sendMessage(textToSend);
  };

  const resetChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: "Hello! I am your Apollo-style AI Symptom Assistant. Describe your symptoms (e.g. 'I have had a throbbing headache and mild fever for 2 days') and I will ask follow-up questions to understand your case, triage severity, and suggest the right specialists and doctors.",
        type: 'welcome'
      }
    ]);
    setSelectedOptions([]);
    setIsRagActive(true);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        height: '600px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        boxShadow: '0 12px 40px rgba(6, 182, 212, 0.18)',
        background: 'rgba(7, 9, 19, 0.95)',
        borderRadius: '16px'
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
            <span 
              style={{ 
                fontSize: '0.7rem', 
                color: isRagActive ? 'var(--secondary-neon)' : '#ef4444', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
            >
              <span 
                style={{ 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  background: isRagActive ? 'var(--secondary-neon)' : '#ef4444', 
                  display: 'inline-block' 
                }} 
              />
              {isRagActive ? "Gemini + Pinecone RAG Active" : "Gemini Only Mode"}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={resetChat}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Reset
          </button>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message Sequence Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          return (
            <div 
              key={index} 
              style={{
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                maxWidth: '90%',
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
                      background: 'rgba(7, 9, 19, 0.85)',
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
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 500 }}>TRIAGE PRIORITY:</span>
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

                    <div style={{ fontSize: '0.78rem', color: '#fff' }}>
                      <strong>Assessment:</strong> {msg.triage.analysis}
                    </div>

                    {msg.triage.specialist && (
                      <div style={{ fontSize: '0.74rem', color: '#fff' }}>
                        <strong>Specialist:</strong> {msg.triage.specialist}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <strong>Advice:</strong> {msg.triage.followUp}
                    </div>

                    {/* Quick Skyscanner Trigger Action Link */}
                    {msg.triage.specialist && (
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
                    )}
                  </div>
                )}
              </div>

              {/* Recommended Doctors Carousel/List */}
              {isAi && msg.doctors && msg.doctors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', width: '100%' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    RECOMMENDED DOCTORS IN BANGALORE:
                  </span>
                  <div 
                    style={{
                      display: 'flex',
                      gap: '10px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                      width: '100%',
                      scrollbarWidth: 'thin'
                    }}
                  >
                    {msg.doctors.map((doc, docIdx) => (
                      <div 
                        key={doc.doctorId || docIdx}
                        style={{
                          flex: '0 0 260px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>
                            Dr. {doc.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px' }}>
                            <Star size={10} fill="var(--accent-star)" stroke="var(--accent-star)" />
                            <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 'bold' }}>
                              {doc.googleRating || doc.scrapedRating || 4.5}
                            </span>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {doc.specialty} • {doc.experience} yrs exp
                        </span>

                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={10} style={{ color: 'var(--primary-neon)' }} />
                          {doc.clinicName} ({doc.distanceKm} km)
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--secondary-neon)' }}>
                            Fee: ₹{doc.fee}
                          </span>
                          <button
                            onClick={() => {
                              if (onBook) {
                                onBook(doc);
                                onClose();
                              } else {
                                onSearchSpecialty(doc.specialty);
                                onClose();
                              }
                            }}
                            style={{
                              background: 'rgba(6, 182, 212, 0.1)',
                              border: '1px solid rgba(6, 182, 212, 0.35)',
                              borderRadius: '6px',
                              color: 'var(--primary-neon)',
                              padding: '4px 8px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--primary-neon)';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(6, 182, 212, 0.1)';
                              e.target.style.color = 'var(--primary-neon)';
                            }}
                          >
                            Book
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Option choices selection box */}
              {isAi && index === messages.length - 1 && !msg.isComplete && msg.options && msg.options.length > 0 && !isLoading && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  {msg.optionsType === 'multi' ? (
                    <div 
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Select multiple options:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.options.map((opt, optIdx) => {
                          const isChecked = selectedOptions.includes(opt);
                          return (
                            <label 
                              key={optIdx} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                fontSize: '0.8rem', 
                                color: '#fff',
                                cursor: 'pointer',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: isChecked ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                                border: '1px solid ' + (isChecked ? 'rgba(6, 182, 212, 0.3)' : 'transparent'),
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => handleToggleOption(opt)}
                                style={{ 
                                  accentColor: 'var(--primary-neon)',
                                  width: '15px',
                                  height: '15px',
                                  cursor: 'pointer'
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleConfirmMultiSelect}
                        disabled={selectedOptions.length === 0}
                        style={{
                          marginTop: '6px',
                          background: selectedOptions.length === 0 ? 'rgba(6, 182, 212, 0.1)' : 'var(--primary-neon)',
                          border: selectedOptions.length === 0 ? '1px solid rgba(6, 182, 212, 0.2)' : 'none',
                          borderRadius: '6px',
                          color: selectedOptions.length === 0 ? 'var(--text-muted)' : '#000',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: selectedOptions.length === 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          width: '100%'
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      {msg.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => sendMessage(opt)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                            e.currentTarget.style.borderColor = 'var(--primary-neon)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.25)';
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
          placeholder="Describe symptoms (e.g. cough, fever)..."
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
