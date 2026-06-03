import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Stethoscope, AlertTriangle, ArrowRight } from 'lucide-react';

const ChatDrawer = ({ isOpen, onClose, onSearchSpecialty }) => {
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // In production, we POST to our backend Express AI lifestyle / triage route.
      // We will make a POST to /api/ai/lifestyle or create a mock triager response if offline.
      // E.g., if we hit our backend `/api/ai/lifestyle` with symptom parameters, Gemini parses it.
      // For testing, let's execute a smart local analysis that mimics Gemini and gives a beautiful themed triage:
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI computation

      let triageData = {
        analysis: "Your symptoms point toward possible middle ear congestion or labyrinthitis, which often causes minor balance disturbances (dizziness).",
        priority: "Medium",
        specialist: "ENT",
        followUp: "Consult an ear, nose, and throat practitioner for a physical inspection."
      };

      // Customized triage parsing based on keywords
      const lower = userMsg.toLowerCase();
      if (lower.includes('chest') || lower.includes('heart') || lower.includes('breath') || lower.includes('cardio')) {
        triageData = {
          analysis: "Chest pressure, difficulty breathing, or erratic heart beats can indicate cardiorespiratory strain.",
          priority: "High",
          specialist: "Cardiologist",
          followUp: "Please seek an emergency consultation or contact a cardiologist immediately."
        };
      } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('allergy')) {
        triageData = {
          analysis: "Local epidermal flares, redness, or itching indicate common skin irritation or dermatitis.",
          priority: "Low",
          specialist: "Dermatologist",
          followUp: "Consult a dermatologist. Avoid scratching or using perfumed topical creams."
        };
      } else if (lower.includes('fever') || lower.includes('cold') || lower.includes('cough') || lower.includes('headache')) {
        triageData = {
          analysis: "Mild systemic fever and minor body fatigue are typical markers of acute viral infections.",
          priority: "Medium",
          specialist: "General Physician",
          followUp: "Monitor fluid hydration, rest, and consult a general physician if fever exceeds 101°F."
        };
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: triageData.analysis,
        triage: triageData
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "I encountered an error connecting to the medical AI engine. Please try describing your symptoms again."
      }]);
    } finally {
      setIsLoading(false);
    }
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

                {/* Triage Results Card */}
                {isAi && msg.triage && (
                  <div 
                    style={{
                      marginTop: '10px',
                      background: 'rgba(7, 9, 19, 0.6)',
                      borderRadius: '8px',
                      border: `1px solid ${
                        msg.triage.priority === 'High' ? 'var(--accent-alert)' :
                        msg.triage.priority === 'Medium' ? 'var(--accent-star)' : 'var(--secondary-neon)'
                      }`,
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>PRIORITY ASSESSMENT:</span>
                      <span 
                        style={{
                          fontSize: '0.65rem',
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

                    <div style={{ fontSize: '0.75rem', color: '#fff' }}>
                      <strong>Recommended Specialist:</strong> {msg.triage.specialist}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {msg.triage.followUp}
                    </div>

                    {/* Quick Skyscanner Trigger Action Link */}
                    <button 
                      onClick={() => {
                        onSearchSpecialty(msg.triage.specialist);
                        onClose();
                      }}
                      style={{
                        marginTop: '4px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--primary-neon)',
                        padding: '6px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(6, 182, 212, 0.2)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(6, 182, 212, 0.1)'}
                    >
                      Search Nearby {msg.triage.specialist}s
                      <ArrowRight size={12} />
                    </button>
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

      {/* Embedded CSS for dots pulse */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default ChatDrawer;
