import React, { useState } from 'react';
import { Upload, AlertOctagon, Heart, BrainCircuit, Activity, ArrowRight, Loader, Pill, ShieldAlert, CheckCircle } from 'lucide-react';
import reportBg from '../assets/prescription.jpg';
import { motion } from 'framer-motion';

// Framer Motion variants — same pattern as ReportAnalyzer / Home.jsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const descriptionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
  hover: { y: -6, transition: { duration: 0.25, ease: 'easeInOut' } },
};

const PrescriptionAnalyzer = ({ token, onOpenAuth }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('prescription', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/prescriptions/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.message || 'Error analyzing prescription file.');
      }
    } catch (err) {
      console.error(err);
      alert('Internal Server Error connecting to prescription analyzer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background */}
      <img
        src={reportBg}
        alt="Medical background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950 z-0"></div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', zIndex: 10 }}
      >

        {/* Header Banner */}
        <motion.section
          variants={containerVariants}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <motion.h2 variants={headingVariants} style={{ fontSize: '2rem', color: '#fff', fontWeight: 800, fontFamily: 'Outfit' }}>
            AI Prescription Analyzer
          </motion.h2>
          <motion.p variants={descriptionVariants} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Scan your doctor's handwritten or digital prescriptions. Our system uses Gemini Vision to decode medicine names, usages, and side effects.
          </motion.p>
        </motion.section>

        {/* Main Console */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

          {/* Lockscreen Panel for Unauthenticated Users */}
          {!token && (
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="glass-panel"
              style={{ padding: '50px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', textAlign: 'center' }}
            >
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <Upload style={{ color: 'var(--accent-alert)' }} size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Authentication Required</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '360px' }}>
                  Please login or sign up to analyze medical prescriptions.
                </p>
              </div>
              <button 
                onClick={onOpenAuth}
                style={{
                  background: 'var(--primary-neon)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)'
                }}
              >
                Login / Sign Up
              </button>
            </motion.div>
          )}

          {/* Upload Container Panel */}
          {token && !result && (
            <motion.form
              variants={cardVariants}
              whileHover="hover"
              onSubmit={handleUploadSubmit}
              className="glass-panel"
              style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', borderStyle: 'dashed', borderWidth: '2px', borderColor: file ? 'var(--primary-neon)' : 'var(--card-border)', maxWidth: '550px', width: '100%', margin: '40px auto 0' }}
            >
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <Pill style={{ color: 'var(--primary-neon)' }} size={28} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <label htmlFor="prescription-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  <span style={{ color: 'var(--primary-neon)', fontWeight: 'bold', fontSize: '0.9rem' }}>Click to upload prescription</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'block', marginTop: '4px' }}>
                    Supports PDFs, PNGs, and JPEGs up to 5MB
                  </span>
                  <input 
                    id="prescription-upload" 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {file && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', color: '#fff' }}>
                  Selected Document: <strong>{file.name}</strong>
                </div>
              )}

              <button 
                type="submit"
                disabled={!file || isLoading}
                style={{
                  marginTop: '10px',
                  background: file && !isLoading ? 'var(--primary-neon)' : 'rgba(255, 255, 255, 0.05)',
                  color: file && !isLoading ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: file && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 2s linear infinite' }} />
                    Extracting &amp; Analyzing...
                  </>
                ) : (
                  'Trigger Prescription Analysis'
                )}
              </button>
            </motion.form>
          )}

          {/* 📊 Prescription Analysis Result Console */}
          {result && (
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="glass-panel"
              style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              
              {/* Header / Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DIGITIZED PRESCRIPTION DATA</span>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>AI Analysis Dashboard</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--card-border)',
                      borderRadius: '6px',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    Analyze New
                  </button>
                </div>
              </div>

              {/* Medicine Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} style={{ color: 'var(--primary-neon)' }} />
                  Prescribed Medications ({result.analysis.medicines.length})
                </h4>

                {result.analysis.medicines.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No medications were identified. Try uploading a clearer picture or document.
                  </div>
                ) : (
                  result.analysis.medicines.map((med, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      whileHover="hover"
                      className="glass-panel"
                      style={{ 
                        padding: '24px', 
                        background: 'rgba(0,0,0,0.15)', 
                        borderColor: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}
                    >
                      {/* Medicine Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pill size={16} style={{ color: 'var(--primary-neon)' }} />
                          </div>
                          <div>
                            <h5 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>{med.name}</h5>
                          </div>
                        </div>
                      </div>

                      {/* Drug Information Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                        
                        {/* Reason & Description */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Reason for Prescription</span>
                            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{med.reason}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Clinical Description</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{med.description}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Standard Administration</span>
                            <span style={{ fontSize: '0.8rem', color: '#fff' }}>{med.usage}</span>
                          </div>
                        </div>

                        {/* Safety: Precautions & Side Effects */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--secondary-neon)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              <CheckCircle size={10} /> Precautions
                            </span>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {med.precautions.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-alert)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              <ShieldAlert size={10} /> Common Side Effects
                            </span>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {med.sideEffects.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        </div>

                      </div>

                    </motion.div>
                  ))
                )}
              </div>

              {/* Overall Advice Box */}
              {result.analysis.overallAdvice && (
                <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PHARMACIST'S ADVISORY</span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                    {result.analysis.overallAdvice}
                  </p>
                  <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ⚠️ Disclaimer: This analysis is for educational purposes only. Always consult your prescribing doctor before changing any medication schedules.
                  </div>
                </div>
              )}

            </motion.div>
          )}

        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </motion.div>
    </div>
  );
};

export default PrescriptionAnalyzer;
