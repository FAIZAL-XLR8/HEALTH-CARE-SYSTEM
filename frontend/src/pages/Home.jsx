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
            A Skyscanner-inspired platform for diagnostic tests and specialized clinics. View real-time deals, locate nearby NABL labs, and consult with Gemini AI assistants.
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            
            {/* Feature 1: Report Locker */}
            <motion.div 
              variants={featureCardVariants}
              whileHover="hover"
              className="glass-panel" 
              style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <FileText style={{ color: 'var(--primary-neon)' }} size={20} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary-neon)', fontWeight: 600, background: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    GEMINI VISION
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>AI Laboratory Locker</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Securely store and analyze complete diagnostic reports. Our LLM parses outliers and tracks metric graphs.
                </p>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('reports')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-neon)';
                  e.target.style.color = '#000';
                  e.target.style.borderColor = 'var(--primary-neon)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                  e.target.style.color = '#fff';
                  e.target.style.borderColor = 'var(--card-border)';
                }}
              >
                Open AI Locker
                <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Feature 2: Prescription Decrypter */}
            <motion.div 
              variants={featureCardVariants}
              whileHover="hover"
              className="glass-panel" 
              style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <Pill style={{ color: 'var(--secondary-neon)' }} size={20} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary-neon)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    MULTIMODAL AI
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>AI Prescription Scanner</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Deconstruct handwritten physician scripts instantly. Verifies chemical warnings, common side effects, and precautions.
                </p>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('prescription')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--secondary-neon)';
                  e.target.style.color = '#000';
                  e.target.style.borderColor = 'var(--secondary-neon)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                  e.target.style.color = '#fff';
                  e.target.style.borderColor = 'var(--card-border)';
                }}
              >
                Scan Prescription
                <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Feature 3: Gemini Chatbot */}
            <motion.div 
              variants={featureCardVariants}
              whileHover="hover"
              className="glass-panel" 
              style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <MessageSquare style={{ color: 'var(--primary-neon)' }} size={20} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary-neon)', fontWeight: 600, background: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    24/7 ACTIVE
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Gemini Symptom Triage</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Consult our live clinical chatbot about active symptoms. Receives recommendations and routes directly to clinics.
                </p>
              </div>
              <button 
                onClick={() => onOpenChat && onOpenChat()}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-neon)';
                  e.target.style.color = '#000';
                  e.target.style.borderColor = 'var(--primary-neon)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                  e.target.style.color = '#fff';
                  e.target.style.borderColor = 'var(--card-border)';
                }}
              >
                Consult Assistant
                <ArrowRight size={14} />
              </button>
            </motion.div>

          </div>
        </motion.section>

        {/* 🛡️ Core Trust Value Cards */}
        <motion.section 
          variants={featuresContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}
        >
          <motion.div 
            variants={featureCardVariants}
            whileHover="hover"
            className="glass-panel" 
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
              <ShieldCheck style={{ color: 'var(--primary-neon)' }} size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>NABL Verified Pricing</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Get verified pricing matrices across standard accredited labs (Apollo, Thyrocare, SRL) with 100% price transparency.
            </p>
          </motion.div>

          <motion.div 
            variants={featureCardVariants}
            whileHover="hover"
            className="glass-panel" 
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
              <Clock style={{ color: 'var(--secondary-neon)' }} size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>2:00 AM Cron Synced</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Our nightly background crawlers execute sequential crawls to ensure cached baseline prices remain completely fresh.
            </p>
          </motion.div>

          <motion.div 
            variants={featureCardVariants}
            whileHover="hover"
            className="glass-panel" 
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
              <Brain style={{ color: 'var(--primary-neon)' }} size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>Gemini Multimodal Parser</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Upload any medical diagnostic PDF or image and let our AI parse abnormal boundaries, matching you instantly to local specialist doctors.
            </p>
          </motion.div>
        </motion.section>

        <style dangerouslySetInnerHTML={{
          __html: `
        .suggestion-item:hover {
          background: rgba(6, 182, 212, 0.1) !important;
          color: var(--primary-neon) !important;
        }
      `}} />
      </motion.div>
    </div>
  );
};

export default Home;
