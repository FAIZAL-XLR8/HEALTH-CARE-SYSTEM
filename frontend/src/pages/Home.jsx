import React, { useState } from 'react';
import { Search, MapPin, Stethoscope, TestTube, Brain, HeartPulse, ShieldCheck, Clock } from 'lucide-react';

const Home = ({ onSearch }) => {
  const [activeTab, setActiveTab] = useState('labs'); // 'labs' | 'doctors'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationInput, setLocationInput] = useState('Koramangala, Bengaluru');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    onSearch({
      type: activeTab,
      query: searchQuery.trim(),
      location: locationInput.trim()
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
          Compare Prices, Distances & Ratings Instantly
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          A Skyscanner-inspired platform for diagnostic tests and specialized clinics. View real-time deals, locate nearby NABL labs, and consult with Gemini AI assistants.
        </p>
      </section>

      {/* 🔍 Dynamic Skyscanner-Style Search Console */}
      <section className="glass-panel" style={{ padding: '24px', maxWidth: '850px', width: '100%', margin: '0 auto', position: 'relative' }}>
        
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px', alignItems: 'center' }}>
          
          {/* Query input */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>

          {/* Location input */}
          <div style={{ position: 'relative' }}>
            <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={18} />
            <input 
              type="text" 
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Your neighborhood (e.g. Koramangala)..."
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
      </section>

      {/* 🛡️ Core Trust Value Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
            <ShieldCheck style={{ color: 'var(--primary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>NABL Verified Pricing</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Get verified pricing matrices across standard accredited labs (Apollo, Thyrocare, SRL) with 100% price transparency.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
            <Clock style={{ color: 'var(--secondary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>2:00 AM Cron Synced</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Our nightly background crawlers execute sequential crawls to ensure cached baseline prices remain completely fresh.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px' }}>
            <Brain style={{ color: 'var(--primary-neon)' }} size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>Gemini Multimodal Parser</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Upload any medical diagnostic PDF or image and let our AI parse abnormal boundaries, matching you instantly to local specialist doctors.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Home;
