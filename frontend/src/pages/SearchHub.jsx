import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowDownUp, RefreshCw, Sparkles, Navigation, Briefcase } from 'lucide-react';
import MapView from '../components/MapView';

const SearchHub = ({ searchParams, onBook }) => {
  const [providers, setProviders] = useState([]);
  const [sortTab, setSortTab] = useState('best'); // 'best' | 'cheapest' | 'fastest'
  const [activeProviderId, setActiveProviderId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const getAreaName = (coords) => {
    if (!coords || coords.length !== 2) return 'Bengaluru';
    const [lng, lat] = coords;
    if (lng > 77.630 && lng < 77.650 && lat > 12.965 && lat < 12.980) return 'Indiranagar';
    if (lng > 77.610 && lng < 77.630 && lat > 12.925 && lat < 12.945) return 'Koramangala';
    if (lng > 77.625 && lng < 77.645 && lat > 12.900 && lat < 12.920) return 'HSR Layout';
    if (lng > 77.630 && lng < 77.645 && lat > 12.950 && lat < 12.965) return 'Domlur';
    if (lng > 77.700) return 'Whitefield';
    return 'Bengaluru';
  };

  const { query } = searchParams;

  // Fetch initial cached search results from backend
  const fetchInitialResults = async (force = false) => {
    setIsVerifying(true);
    setProgressWidth(20);
    try {
      const endpoint = `/api/doctors/search?specialty=${query}&forceRefresh=${force}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      setProviders(data.doctors || []);
      setProgressWidth(100);
      setTimeout(() => setIsVerifying(false), 500);
    } catch (err) {
      console.error('Failed fetching spatial search results:', err);
      setProgressWidth(100);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchInitialResults();
  }, [searchParams]);

  // Skyscanner Smart Sorting Engine for Doctors
  const getSortedProviders = () => {
    if (!providers || providers.length === 0) return [];

    return [...providers].sort((a, b) => {
      if (sortTab === 'cheapest') {
        const priceA = a.fee || a.consultationFee || 0;
        const priceB = b.fee || b.consultationFee || 0;
        return priceA - priceB;
      }

      if (sortTab === 'fastest') {
        return b.experience - a.experience; // Doctor next slot proxy: Experience
      }

      // 'BEST' Tab: Dynamic Weighted Scoring (Price 60%, Experience 40%)
      const getScore = (p) => {
        const price = p.fee || p.consultationFee || 500;
        const priceScore = Math.max(0, 100 - (price / 10)); // cheaper is better

        const credentialScore = p.experience > 15 ? 100 : 50;

        return (priceScore * 0.60) + (credentialScore * 0.40);
      };

      return getScore(b) - getScore(a);
    });
  };

  const sortedList = getSortedProviders();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>

      {/* 📡 Skyscanner Loading Tracker HUD */}
      {isVerifying && (
        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressWidth}%` }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} className="glow-indicator" style={{ animation: 'spin 2s linear infinite' }} />
            📡 Searching active clinic partners... fetching doctor profiles matching "{query}"
          </span>
        </div>
      )}

      {/* Skyscanner Split Screen Grid */}
      <div className="skyscanner-layout" style={{ marginTop: '24px' }}>

        {/* Left Side: Sorting Tabs & Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header Dashboard Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                Clinics matching: {query}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing all active doctors in Bengaluru • {providers.length} found
              </span>
            </div>

            {/* Force Refresh Manual Hook */}
            <button
              onClick={() => fetchInitialResults(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                color: 'var(--primary-neon)',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} />
              Re-sync List
            </button>
          </div>

          {/* Skyscanner Sorting Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--card-border)', borderRadius: '12px', overflow: 'hidden', padding: '1px' }}>
            <button
              onClick={() => setSortTab('best')}
              style={{
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                background: sortTab === 'best' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-obsidian)',
                color: sortTab === 'best' ? 'var(--primary-neon)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <Sparkles size={14} />
              Best Match
            </button>
            <button
              onClick={() => setSortTab('cheapest')}
              style={{
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                background: sortTab === 'cheapest' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-obsidian)',
                color: sortTab === 'cheapest' ? 'var(--secondary-neon)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <ArrowDownUp size={14} />
              Cheapest
            </button>
            <button
              onClick={() => setSortTab('fastest')}
              style={{
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
                background: sortTab === 'fastest' ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-obsidian)',
                color: sortTab === 'fastest' ? 'var(--accent-alert)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <Navigation size={14} />
              Highest Experience
            </button>
          </div>

          {/* 📂 Listings Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active specialist clinics found matching this query in Bengaluru.
              </div>
            ) : (
              sortedList.map((p) => {
                const isActive = activeProviderId === p.doctorId;

                return (
                  <div
                    key={p.doctorId}
                    className="glass-panel"
                    onMouseEnter={() => setActiveProviderId(p.doctorId)}
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'all 0.3s ease',
                      borderWidth: isActive ? '1px' : '1px',
                      borderColor: isActive ? 'var(--primary-neon)' : 'var(--card-border)',
                      boxShadow: isActive ? '0 0 15px rgba(6, 182, 212, 0.08)' : 'none'
                    }}
                  >
                    {/* Top Row: Provider Name & Credentials */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{p.name}</h3>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          {p.specialty}
                        </span>
                      </div>

                      {/* Experience Badge instead of rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <Briefcase size={12} style={{ color: 'var(--secondary-neon)' }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: 'var(--secondary-neon)' }}>
                          {p.experience || p.experienceYears || 10} Yrs Exp
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Distance, Timings and Pricing */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>LOCATION</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{getAreaName(p.coordinates)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>TIMINGS</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }} title={p.activeHours}>
                          {p.activeHours}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>CHARGES</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary-neon)', transition: 'all 0.3s' }}>
                            ₹{p.fee || p.consultationFee}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Action CTA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🏥 Clinic Visit Consultation
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onBook(p)}
                          style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.35)',
                            borderRadius: '8px',
                            color: 'var(--primary-neon)',
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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
                          Book Appointment
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Geolocation Interactive MapHUD */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
          <MapView
            providers={providers}
            activeProviderId={activeProviderId}
            onSelectProvider={setActiveProviderId}
          />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default SearchHub;
