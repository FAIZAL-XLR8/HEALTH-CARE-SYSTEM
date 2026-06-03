import React, { useState } from 'react';
import { Upload, AlertOctagon, Heart, BrainCircuit, Activity, Calendar, ArrowRight, Loader } from 'lucide-react';

const ReportAnalyzer = ({ onSearchDoctor }) => {
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

    try {
      // POST to our backend Express multimodal analysis route
      const response = await fetch('/api/reports/analyze', {
        method: 'POST',
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
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Banner */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800 }}>
          Multimodal AI Laboratory Report Locker
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Drop any diagnostic PDF or image (CBC, Lipid Panel, Thyroid) and let Gemini read, analyze, and map your metrics instantly.
        </p>
      </section>

      {/* Main Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Upload Container Panel */}
        {!analysis && (
          <form onSubmit={handleUploadSubmit} className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', borderStyle: 'dashed', borderWidth: '2px', borderColor: file ? 'var(--primary-neon)' : 'var(--card-border)' }}>
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
                  Gemini Parsing Document...
                </>
              ) : (
                'Trigger AI Analysis'
              )}
            </button>
          </form>
        )}

        {/* 📊 High-End AI Analysis Dashboard Renders */}
        {analysis && (
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            
            {/* Header patient profile info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PATIENT LOCKER SUMMARY</span>
                <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>Patient: {analysis.patientName || 'Aarav Mehta'}</h3>
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
              <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--primary-neon)' }}>
                "{analysis.fullSummary}"
              </p>
            </div>

            {/* Dual Grid: Identified Tests & High Risk Critical Flags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Identified tests */}
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
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
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderColor: 'rgba(244, 63, 94, 0.15)' }}>
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
                <h4 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
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

          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default ReportAnalyzer;
