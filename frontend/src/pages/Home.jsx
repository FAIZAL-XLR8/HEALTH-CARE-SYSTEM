import React, { useState } from 'react';
import { Search, Stethoscope, Brain, HeartPulse, ShieldCheck, Clock } from 'lucide-react';

const Home = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonSpecialties = [
    'Dentist',
    'Gynaecologist/obstetrician',
    'General Physician',
    'Dermatologist',
    'ENT Specialist',
    'Homoeopath',
    'Ayurveda'
  ];

  const allSpecialties = [
    'Dentist',
    'Gynaecologist/obstetrician',
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
      .replace(/gyne/g, 'gyna')         // typo: gynecologist -> gynaecologist
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
      type: 'doctors',
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
      
      {/* 🚀 Hero Headline Section */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '750px', margin: '0 auto' }}>
        <span style={{
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
        }}>
          <HeartPulse size={14} />
          Bengaluru's Premier Healthcare Aggregator
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: '1.1', background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Compare & Consult Specialists Instantly
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          A Skyscanner-inspired platform for specialized clinics and consulting. View real-time ratings, locate nearby specialists on our interactive map, and consult with Gemini AI assistants.
        </p>
      </section>

      {/* 🔍 Dynamic Skyscanner-Style Search Console */}
      <section className="glass-panel" style={{ padding: '24px', maxWidth: '850px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
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
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Specialty (e.g. ENT, Dentist, Gynaecologist)..."
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
            {showSuggestions && (
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
          <button 
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
          </button>
        </form>

        {/* Quick Tags under the search console */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Popular in Bengaluru:</span>
          {['ENT', 'Cardiologist', 'General Physician'].map(tag => (
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
          ))}
        </div>
      </section>

      {/* 🛡️ Core Trust Value Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <ShieldCheck style={{ color: 'var(--primary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>Verified Specialist Profiles</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Compare ratings, experience, and consultation fees across verified clinics in Bengaluru.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <Clock style={{ color: 'var(--secondary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>2:00 AM Cron Synced</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Our background crawlers sync with clinic schedules nightly to keep doctor profiles and availability slots up to date.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <Brain style={{ color: 'var(--primary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>Gemini Multimodal Parser</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Upload any medical prescriptions or reports to let our AI assistant parse coordinates and recommend local matching doctors.
          </p>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .suggestion-item:hover {
          background: rgba(6, 182, 212, 0.1) !important;
          color: var(--primary-neon) !important;
        }
      `}} />
    </div>
  );
};

export default Home;
