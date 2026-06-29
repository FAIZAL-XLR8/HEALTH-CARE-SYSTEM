import React, { useState } from 'react';
import { Upload, AlertOctagon, Heart, BrainCircuit, Activity, Calendar, ArrowRight, Loader } from 'lucide-react';
import reportBg from '../assets/report.jpg';
import { motion } from 'framer-motion';

// Framer Motion variants — same pattern as Home.jsx
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

const ReportAnalyzer = ({ onSearchDoctor, token, onOpenAuth }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('report', file);
    formData.append('userId', 'mock-user-123'); // Demo placeholder

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // POST to our backend Express multimodal analysis route
      const response = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        alert(data.message || 'Error parsing report file.');
      }
    } catch (err) {
      console.error(err);
      alert('Internal Server Error connecting to report analyzer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background */}
      <img
        src={reportBg}
        alt="Medical report background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50  z-0"></div>

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
        <motion.h2 variants={headingVariants} style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Multimodal AI Laboratory Report Locker
        </motion.h2>
        <motion.p variants={descriptionVariants} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Drop any diagnostic PDF or image (CBC, Lipid Panel, Thyroid) and let Gemini read, analyze, and map your metrics instantly.
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
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>Authentication Required</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '360px' }}>
                Please login or sign up to access your personal AI medical report locker.
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
        {token && !analysis && (
          <motion.form
            variants={cardVariants}
            whileHover="hover"
            onSubmit={handleUploadSubmit}
            className="glass-panel"
            style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', borderStyle: 'dashed', borderWidth: '2px', borderColor: file ? 'var(--primary-neon)' : 'var(--card-border)' }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '16px' }}>
              <Upload style={{ color: 'var(--primary-neon)' }} size={28} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                <span style={{ color: 'var(--primary-neon)', fontWeight: 'bold', fontSize: '0.9rem' }}>Click to upload report</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'block', marginTop: '4px' }}>
                  Supports PDFs, PNGs, and JPEGs up to 5MB
                </span>
                <input 
                  id="file-upload" 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {file && (
              <div style={{ background: 'var(--bg-obsidian)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                Selected Document: <strong>{file.name}</strong>
              </div>
            )}

            <button 
              type="submit"
              disabled={!file || isLoading}
              style={{
                marginTop: '10px',
                background: file && !isLoading ? 'var(--primary-neon)' : 'var(--card-border)',
                color: file && !isLoading ? 'var(--bg-dark)' : 'var(--text-muted)',
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
                  Gemini Parsing Document...
                </>
              ) : (
                'Trigger AI Analysis'
              )}
            </button>
          </motion.form>
        )}

        {/* 📊 High-End AI Analysis Dashboard Renders */}
        {analysis && (
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="glass-panel"
            style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}
          >
            
            {/* Header patient profile info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PATIENT LOCKER SUMMARY</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>Patient: {analysis.patientName || 'Aarav Mehta'}</h3>
              </div>
              
              <button 
                onClick={() => setAnalysis(null)}
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
                Clear Analysis
              </button>
            </div>

            {/* Simple patient-friendly brief summary */}
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--primary-neon)' }}>
                "{analysis.fullSummary}"
              </p>
            </div>

            {/* Dual Grid: Identified Tests & High Risk Critical Flags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Identified tests */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-dark)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-neon)', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} />
                  Identified Tests
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.testsIdentified.map((test, index) => (
                    <span key={index} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>
                      • {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* Critical out of bounds lights */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-dark)', borderColor: 'rgba(244, 63, 94, 0.15)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-alert)', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertOctagon size={14} />
                  Out-of-Range Metrics
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.criticalAlerts.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--secondary-neon)' }}>🟢 All metrics within normal thresholds.</span>
                  ) : (
                    analysis.criticalAlerts.map((alert, index) => (
                      <span key={index} style={{ fontSize: '0.78rem', color: '#fda4af', display: 'block' }}>
                        🔴 {alert}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Dynamic AI Triage Recommendation Panel */}
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center', gap: '16px' }}>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600, letterSpacing: '0.05em' }}>AI RECOMMENDATION</span>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Consult a {analysis.recommendedSpecialist}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Based on flagged out-of-range metrics, scheduling a physical consultation with a local {analysis.recommendedSpecialist} is highly advised.
                </p>
              </div>

              {/* Skyscanner style CTA linking report to Spatial Doctor search instantly */}
              <button 
                onClick={() => onSearchDoctor(analysis.recommendedSpecialist)}
                style={{
                  background: 'var(--primary-neon)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)'
                }}
              >
                Find Nearby {analysis.recommendedSpecialist}
                <ArrowRight size={14} />
              </button>

            </div>

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

export default ReportAnalyzer;
