import React, { useState, useEffect } from 'react';
import { Search, MapPin, Stethoscope, TestTube, Brain, HeartPulse, ShieldCheck, Clock, FileText, Pill, MessageSquare, ArrowRight } from 'lucide-react';
import hospital from '../assets/hospital_pic.jpg';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';



// Reusable Framer Motion variants for structured animation sequence
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
};

const descriptionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
};

const searchCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" } 
  },
};

const featuresContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const featureCardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
  hover: {
    y: -6,
    transition: { duration: 0.25, ease: "easeInOut" }
  }
};

const searchButtonHoverVariants = {
  hover: {
    scale: 1.04,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const Home = ({ onSearch, onNavigate, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState('labs'); // 'labs' | 'doctors'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonSpecialties = [
    'Dentist',
    'Gynecologist/obstetrician',
    'General Physician',
    'Dermatologist',
    'ENT Specialist',
    'Homoeopath',
    'Ayurveda'
  ];

  const allSpecialties = [
    'Dentist',
    'Gynecologist/obstetrician',
    'General Physician',
    'Dermatologist',
    'ENT Specialist',
    'Homoeopath',
    'Ayurveda',
    'Cardiologist',
    'Neurologist',
    'Pediatrician',
    'Orthopedist',
    'Oncologist',
    'Psychiatrist',
    'Urologist',
    'Gastroenterologist',
    'Pulmonologist',
    'Endocrinologist',
    'Nephrologist',
    'Ophthalmologist',
    'Physiotherapist',
    'Sexologist',
    'Dietitian'
  ];

  const getFilteredSpecialties = () => {
    if (!searchQuery.trim()) return commonSpecialties;

    // Normalize query and handle common spelling mistakes / variations
    const cleanQuery = searchQuery.toLowerCase().trim()
      .replace(/nuer/g, 'neur')         // typo: nuerologist -> neurologist
      .replace(/neurolg/g, 'neurolog')   // typo: neurolgist -> neurologist
      .replace(/physcian/g, 'physician') // typo: general physcian -> general physician
      .replace(/physican/g, 'physician') // typo: general physican -> general physician
      .replace(/gyna/g, 'gyne')         // typo: gynaecologist -> gynecologist
      .replace(/cardio/g, 'cardio');

    const scored = allSpecialties.map(spec => {
      const specLower = spec.toLowerCase();
      let score = 0;

      if (specLower === cleanQuery) {
        score = 100; // Exact match
      } else if (specLower.startsWith(cleanQuery)) {
        score = 90;  // Starts with prefix
      } else if (specLower.includes(cleanQuery)) {
        score = 80;  // Contains substring
      } else {
        // Sequential matching check (fzf-style fuzzy search)
        let qIdx = 0;
        let matchCount = 0;
        for (let i = 0; i < specLower.length; i++) {
          if (specLower[i] === cleanQuery[qIdx]) {
            qIdx++;
            if (qIdx === cleanQuery.length) {
              matchCount = cleanQuery.length;
              break;
            }
          }
        }
        if (matchCount === cleanQuery.length) {
          score = 50;
        } else {
          // Check for high character intersection (helpful for typos)
          let matchingChars = 0;
          const specChars = new Set(specLower);
          for (const char of cleanQuery) {
            if (specChars.has(char)) {
              matchingChars++;
            }
          }
          const similarity = matchingChars / Math.max(cleanQuery.length, 1);
          if (similarity > 0.75) {
            score = 30 + Math.floor(similarity * 20);
          }
        }
      }
      return { spec, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.spec);
  };

  const suggestions = getFilteredSpecialties();

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery) return;
    let queryVal = searchQuery.trim();
    // Normalize specialty terms for clean database queries
    if (queryVal.toLowerCase() === 'ent specialist' || queryVal.toLowerCase() === 'ent') {
      queryVal = 'ENT';
    }
    onSearch({
      type: activeTab,
      query: queryVal
    });
  };

  const handleSpecialtySelect = (specialty) => {
    const searchVal = specialty === 'ENT Specialist' ? 'ENT' : specialty;
    setSearchQuery(searchVal);
    setShowSuggestions(false);
    onSearch({
      type: 'doctors',
      query: searchVal
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background */}
      <img
        src={hospital}
        alt="Hospital building"
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
        style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: '50px', position: 'relative', zIndex: 10 }}
      >

        {/* 🚀 Hero Headline Section */}
        <motion.section 
          variants={containerVariants}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '750px', margin: '0 auto' }}
        >
          <motion.span 
            variants={badgeVariants}
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: 'var(--primary-neon)',
              padding: '6px 16px',
              borderRadius: '50px',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HeartPulse size={14} />
            Bengaluru's Premier Healthcare Aggregator
          </motion.span>
          <motion.h1 
            variants={headingVariants}
            style={{ fontSize: '3.1rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}
          >
            <span style={{ background: 'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Compare
            </span>{" "}
            <TypeAnimation
              sequence={[
                'Prices',
                2000,
                'Distances',
                2000,
                'Ratings',
                2000
              ]}
              wrapper="span"
              speed={50}
              style={{
                background: 'linear-gradient(135deg, var(--primary-neon) 0%, #0891b2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                display: 'inline-block'
              }}
              repeat={Infinity}
            />{" "}
            <span style={{ background: 'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Instantly
            </span>
          </motion.h1>
          <motion.p 
            variants={descriptionVariants}
            style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.6' }}
          >
            Easily find nearby doctors, specialists, and medical clinics. Compare prices in real-time, locate registered clinics close to you, and consult with our helpful AI health assistants.
          </motion.p>
        </motion.section>

        {/* 🔍 Dynamic Skyscanner-Style Search Console */}
        <motion.section 
          variants={searchCardVariants}
          className="glass-panel" 
          style={{ padding: '24px', maxWidth: '850px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}
        >

          {/* Tab Selectors */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('labs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'labs' ? 'var(--primary-neon)' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === 'labs' ? '#fff' : 'var(--text-muted)',
                border: activeTab === 'labs' ? 'none' : '1px solid var(--card-border)',
              }}
            >
              <TestTube size={16} />
              Diagnostic Tests
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'doctors' ? 'var(--primary-neon)' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === 'doctors' ? '#fff' : 'var(--text-muted)',
                border: activeTab === 'doctors' ? 'none' : '1px solid var(--card-border)',
              }}
            >
              <Stethoscope size={16} />
              Find Doctors
            </button>
          </div>

          {/* Input Form Grid */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px', alignItems: 'center' }}>

            {/* Query input */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                placeholder={activeTab === 'labs' ? "Search tests (e.g. CBC, Lipid, HbA1c)..." : "Specialty (e.g. ENT, Cardiologist)..."}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '14px 16px 14px 40px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />

              {/* Practo-style Common Specialties Dropdown suggestions */}
              {showSuggestions && activeTab === 'doctors' && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    zIndex: 1000,
                    marginTop: '8px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    background: 'rgba(13, 17, 29, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    boxShadow: '0 8px 30px rgba(6, 182, 212, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 0',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ padding: '8px 16px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--card-border)', marginBottom: '4px' }}>
                    {searchQuery.trim() ? 'Suggested Specialities' : 'Common Specialities'}
                  </div>
                  {suggestions.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No matching specialties found. Try searching anyway!
                    </div>
                  ) : (
                    suggestions.map((spec) => (
                      <div
                        key={spec}
                        onMouseDown={() => handleSpecialtySelect(spec)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 16px',
                          fontSize: '0.82rem',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="suggestion-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Search size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{spec}</span>
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                          SPECIALITY
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>



            {/* Search Button */}
            <motion.button
              variants={searchButtonHoverVariants}
              whileHover="hover"
              type="submit"
              style={{
                background: 'linear-gradient(90deg, var(--secondary-neon), #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Search
            </motion.button>
          </form>

          {/* Quick Tags under the search console */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Popular in Bengaluru:</span>
            {activeTab === 'labs' ? (
              ['cbc', 'lipid', 'hba1c'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    cursor: 'pointer'
                  }}
                >
                  {tag === 'cbc' ? 'CBC Test' : tag === 'lipid' ? 'Lipid Profile' : 'Diabetes HbA1c'}
                </button>
              ))
            ) : (
              ['ENT', 'Cardiologist', 'General Physician'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))
            )}
          </div>
        </motion.section>

        {/* 🤖 Advanced AI Features Suite */}
        <motion.section 
          variants={featuresContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
              Explore AI Powered Health Tools
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Leverage Gemini models to manage diagnostic lockers, decrypt handwritten prescriptions, and locate specialists instantly.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', marginTop: '40px', width: '100%' }}>
            
            {/* Feature 1: Report Analyzer */}
            <motion.div 
              variants={featureCardVariants}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '50px', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto'
              }}
            >
              {/* Text Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: 'var(--primary-neon)', 
                  fontWeight: 700, 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  padding: '6px 12px', 
                  borderRadius: '50px', 
                  alignSelf: 'flex-start',
                  letterSpacing: '0.08em',
                  fontFamily: 'Outfit'
                }}>
                  GEMINI VISION AI
                </span>
                <h3 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800, fontFamily: 'Outfit', lineHeight: '1.25' }}>
                  Understand Your Laboratory Reports in Plain English
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  Don't get confused by complex numbers and strange medical words. Simply upload any blood test, lab PDF, or paper scan. Our AI translates it into simple language, highlights abnormal values, and explains what they mean for your body.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Translates diagnostic results into clear, simple summaries.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Flags alert indicators (like high sugar levels) in bright colors.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Organizes your health history securely in one place.
                  </li>
                </ul>
                <button 
                  onClick={() => onNavigate && onNavigate('reports')}
                  style={{
                    background: 'var(--primary-neon)',
                    border: 'none',
                    color: '#000000',
                    borderRadius: '50px',
                    padding: '14px 28px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(6, 182, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 182, 212, 0.25)';
                  }}
                >
                  Analyze My Reports
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Visual Mockup Column */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '360px' }}>
                {/* Background Glow */}
                <div className="glow-backdrop" style={{ background: 'rgba(6, 182, 212, 0.25)' }} />
                
                {/* Main Card (Hinged UI mock) */}
                <div className="glass-panel float-card-anim" style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  zIndex: 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-status" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>REPORT ANALYSIS ACTIVE</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', background: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Gemini Parser</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#fff' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                      <span>Read blood report scan (PDF)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#fff' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                      <span>Convert medical metrics to logs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#fff' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                      <span style={{ color: '#f43f5e', fontWeight: 600 }}>Flag: Cholesterol level (High)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                      <div className="spin-anim" style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--primary-neon)', borderTopColor: 'transparent' }} />
                      <span>Writing plain-English breakdown...</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '6px' }}>
                      <span>PARSING COMPLETION</span>
                      <span style={{ color: 'var(--primary-neon)', fontWeight: 'bold' }}>75%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '75%', height: '100%', background: 'linear-gradient(to right, var(--primary-neon), var(--secondary-neon))', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Prescription Scanner */}
            <motion.div 
              variants={featureCardVariants}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '50px', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto'
              }}
            >
              {/* Visual Mockup Column (Appears on left on desktop due to alternating grid) */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '360px' }}>
                {/* Background Glow */}
                <div className="glow-backdrop" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
                
                {/* Main Card */}
                <div className="glass-panel float-card-anim" style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  zIndex: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Sliding green laser line scanner */}
                  <div className="laser-scanner-line" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--secondary-neon)', padding: '4px', borderRadius: '6px', display: 'flex' }}><Pill size={14} /></span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>PRESCRIPTION SCANNER</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-neon)', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Digitized</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--secondary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Extracted Drug</span>
                      <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 700 }}>Amoxicillin (500mg)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--secondary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Reason for Use</span>
                        <span style={{ fontSize: '0.78rem', color: '#e5e7eb' }}>Bacterial Infection</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--secondary-neon)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Standard Usage</span>
                        <span style={{ fontSize: '0.78rem', color: '#e5e7eb' }}>1 Capsule every 8h</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--secondary-neon)', fontWeight: 600, textTransform: 'uppercase' }}>Precautions</span>
                      <ul style={{ margin: 0, paddingLeft: '12px', fontSize: '0.7rem', color: '#9ca3af' }}>
                        <li>Take post meals with warm water</li>
                        <li>Avoid dairy products</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: 'var(--secondary-neon)', 
                  fontWeight: 700, 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  padding: '6px 12px', 
                  borderRadius: '50px', 
                  alignSelf: 'flex-start',
                  letterSpacing: '0.08em',
                  fontFamily: 'Outfit'
                }}>
                  PRESCRIPTION TRANSLATOR
                </span>
                <h3 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800, fontFamily: 'Outfit', lineHeight: '1.25' }}>
                  Scan & Decode Messy Doctor Handwriting
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  Physician handwriting can be almost impossible to read. Simply take a snapshot of your written prescription page. Our system scans the image, lists the medicine names clearly, explains dosage frequencies, and provides safety precaution alerts.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-neon)', fontWeight: 'bold' }}>✔</div>
                    Scans hard-to-read handwritten prescription cards.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-neon)', fontWeight: 'bold' }}>✔</div>
                    Lists side effects, drug warnings, and directions.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-neon)', fontWeight: 'bold' }}>✔</div>
                    Translates raw scripts into an organized dose timeline.
                  </li>
                </ul>
                <button 
                  onClick={() => onNavigate && onNavigate('prescription')}
                  style={{
                    background: 'var(--secondary-neon)',
                    border: 'none',
                    color: '#000000',
                    borderRadius: '50px',
                    padding: '14px 28px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.25)';
                  }}
                >
                  Scan Prescription
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>

            {/* Feature 3: Symptom Chatbot */}
            <motion.div 
              variants={featureCardVariants}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '50px', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto'
              }}
            >
              {/* Text Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: 'var(--primary-neon)', 
                  fontWeight: 700, 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  padding: '6px 12px', 
                  borderRadius: '50px', 
                  alignSelf: 'flex-start',
                  letterSpacing: '0.08em',
                  fontFamily: 'Outfit'
                }}>
                  VIRTUAL HEALTH CARE
                </span>
                <h3 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800, fontFamily: 'Outfit', lineHeight: '1.25' }}>
                  Consult Your 24/7 AI Health Advisor
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  Chat with our virtual clinical assistant, AeroBot. Explain how you feel in simple terms, and it will ask follow-up questions to understand your symptoms, advise on standard self-care steps, and recommend slots with matched local doctors.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Friendly clinical questions designed in easy-to-read language.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Fast assessments with suggested care actions.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-neon)', fontWeight: 'bold' }}>✔</div>
                    Finds and recommends matches with local doctors immediately.
                  </li>
                </ul>
                <button 
                  onClick={() => onOpenChat && onOpenChat()}
                  style={{
                    background: 'var(--primary-neon)',
                    border: 'none',
                    color: '#000000',
                    borderRadius: '50px',
                    padding: '14px 28px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(6, 182, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 182, 212, 0.25)';
                  }}
                >
                  Consult Assistant
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Visual Mockup Column */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '360px' }}>
                {/* Background Glow */}
                <div className="glow-backdrop" style={{ background: 'rgba(6, 182, 212, 0.2)' }} />
                
                {/* Main Card */}
                <div className="glass-panel float-card-anim" style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  padding: '20px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  zIndex: 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-status" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>AEROBOT VIRTUAL HELPER</span>
                    </div>
                  </div>

                  {/* Chat Dialog simulation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'hidden' }}>
                    <div style={{ 
                      alignSelf: 'flex-start',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '8px 12px',
                      borderRadius: '12px 12px 12px 4px',
                      fontSize: '0.72rem',
                      color: '#e5e7eb',
                      maxWidth: '85%'
                    }}>
                      Hi! Explain your symptoms in simple terms.
                    </div>
                    <div style={{ 
                      alignSelf: 'flex-end',
                      background: 'var(--primary-neon)',
                      padding: '8px 12px',
                      borderRadius: '12px 12px 4px 12px',
                      fontSize: '0.72rem',
                      color: '#000000',
                      fontWeight: 600,
                      maxWidth: '85%'
                    }}>
                      I have a mild fever and a dry cough since yesterday.
                    </div>
                    <div style={{ 
                      alignSelf: 'flex-start',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '8px 12px',
                      borderRadius: '12px 12px 12px 4px',
                      fontSize: '0.72rem',
                      color: '#e5e7eb',
                      maxWidth: '85%'
                    }}>
                      Rest is advised. Let's find you slot bookings with local Physicians?
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary-neon)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '20px', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 600 }}>Book Doctor 📅</span>
                    <span style={{ background: 'rgba(255,255,255,0.03)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 10px', fontSize: '0.65rem' }}>Precautions</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.section>



        <style dangerouslySetInnerHTML={{
          __html: `
        .suggestion-item:hover {
          background: rgba(6, 182, 212, 0.1) !important;
          color: var(--primary-neon) !important;
        }
        @keyframes workflowPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes barGrow {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1); }
        }
        @keyframes floatCard {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.28; }
        }
        @keyframes laserScan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .laser-scanner-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--secondary-neon);
          box-shadow: 0 0 8px var(--secondary-neon);
          animation: laserScan 4s linear infinite;
          z-index: 2;
          pointer-events: none;
        }
        .float-card-anim {
          animation: floatCard 4s ease-in-out infinite;
        }
        .pulse-status {
          animation: workflowPulse 2.2s infinite;
        }
        .bar-grow-anim {
          transform-origin: bottom;
          animation: barGrow 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glow-backdrop {
          position: absolute;
          width: 280px;
          height: 280px;
          filter: blur(80px);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
          animation: glowPulse 4.5s ease-in-out infinite alternate;
        }
      `}} />
      </motion.div>
    </div>
  );
};

export default Home;
