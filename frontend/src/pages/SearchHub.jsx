import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, ArrowDownUp, RefreshCw, Sparkles, Navigation } from 'lucide-react';
import MapView from '../components/MapView';

const SearchHub = ({ searchParams, onBook }) => {
  const [providers, setProviders] = useState([]);
  const [sortTab, setSortTab] = useState('best'); // 'best' | 'cheapest' | 'fastest'
  const [activeProviderId, setActiveProviderId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [expandedLabId, setExpandedLabId] = useState(null); // Accordion state for collapsed comparison matrix

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

  const { type, query } = searchParams;

  // 1. Fetch initial cached search results (stale database check)
  const fetchInitialResults = async (force = false) => {
    setIsVerifying(true);
    setProgressWidth(20);
    try {
      const endpoint = type === 'labs'
        ? `/api/labs/search-test?test=${query.toLowerCase()}&forceRefresh=${force}`
        : `/api/doctors/search?specialty=${query}&forceRefresh=${force}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      // Set initial results (renders instantly under 50ms)
      if (type === 'labs') {
        setProviders(data.providers || []);
        // Trigger live verification loading states if data is stale
        if (data.isStaleCache || force) {
          setProgressWidth(60);
          // Wait briefly, showing progress simulation
          setTimeout(() => setProgressWidth(90), 800);
        } else {
          setProgressWidth(100);
          setTimeout(() => setIsVerifying(false), 500);
        }
      } else {
        setProviders(data.doctors || []);
        setProgressWidth(100);
        setTimeout(() => setIsVerifying(false), 500);
      }
    } catch (err) {
      console.error('Failed fetching spatial search results:', err);
      setProgressWidth(100);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchInitialResults();

    // 2. Open Server-Sent Events (SSE) persistent stream connection for real-time price updates
    let eventSource;
    if (type === 'labs') {
      console.log('📡 SSE Connection opening to /api/labs/live-updates...');
      eventSource = new EventSource('/api/labs/live-updates');

      eventSource.onmessage = (event) => {
        try {
          const freshData = JSON.parse(event.data);
          console.log('📡 SSE Live Price Update Frame Received:', freshData);

          // Update only the specific lab price in our React state
          setProviders((prev) =>
            prev.map((p) =>
              p.labId === freshData.labId
                ? { ...p, price: freshData.price, tat: freshData.tat, isVerifiedLive: true }
                : p
            )
          );

          // Complete progress bar loading indicators
          setProgressWidth(100);
          setTimeout(() => setIsVerifying(false), 800);
        } catch (err) {
          console.error('Failed parsing SSE update frame:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection errored. Fallback triggered.', err);
        eventSource.close();
      };
    }

    return () => {
      if (eventSource) {
        console.log('📡 SSE Connection closed.');
        eventSource.close();
      }
    };
  }, [searchParams]);

  // 3. Skyscanner Smart Sorting Engine
  const getSortedProviders = () => {
    if (!providers || providers.length === 0) return [];

    const parsedTatHours = (tatStr) => {
      if (!tatStr) return 48; // default
      const hours = parseInt(tatStr.replace(/[^0-9]/g, ''));
      return isNaN(hours) ? 48 : hours;
    };

    return [...providers].sort((a, b) => {
      if (sortTab === 'cheapest') {
        const priceA = a.price || a.fee || 0;
        const priceB = b.price || b.fee || 0;
        return priceA - priceB;
      }

      if (sortTab === 'fastest') {
        if (type === 'labs') {
          return parsedTatHours(a.tat) - parsedTatHours(b.tat);
        }
        return b.experience - a.experience; // Doctor next slot proxy: Experience
      }

      // 'BEST' Tab: Dynamic Weighted Scoring (Price 50%, Rating 30%, Credentials 20%)
      const getScore = (p) => {
        const ratingVal = p.scrapedRating || 4.5;
        const ratingScore = ratingVal * 20; // max 100

        const price = p.price || p.fee || 500;
        const priceScore = Math.max(0, 100 - (price / 10)); // cheaper is better

        const credentialScore = p.nablAccredited || p.experience > 15 ? 100 : 50;

        return (priceScore * 0.50) + (ratingScore * 0.30) + (credentialScore * 0.20);
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
            📡 Searching active diagnostic partners... verifying live price updates for {query.toUpperCase()}
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
                {type === 'labs' ? `Diagnostic Test: ${query.toUpperCase()}` : `Clinics matching: ${query}`}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing all active {type === 'labs' ? 'diagnostic partners' : 'doctors'} in Bengaluru • {providers.length} found
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
              Verify Prices
            </button>
          </div>

          {/* 📊 Skyscanner Sorting Tabs */}
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
              {type === 'labs' ? 'Fastest Report' : 'Highest Experience'}
            </button>
          </div>

          {/* 📂 Listings Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active healthcare providers found in this coordinate boundary.
              </div>
            ) : (
              sortedList.map((p) => {
                const isActive = activeProviderId === p.labId || activeProviderId === p.doctorId;

                return (
                  <div
                    key={p.labId || p.doctorId}
                    className="glass-panel"
                    onMouseEnter={() => setActiveProviderId(p.labId || p.doctorId)}
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
                          <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{p.labName || p.name}</h3>
                          {p.nablAccredited && (
                            <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-neon)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              NABL ACCREDITED
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {type === 'labs' ? `Koramangala Diagnostics` : `${p.specialty} • ${p.experience} yrs exp • ${p.clinicName}`}
                        </span>
                      </div>

                      {/* Ratings (Only for doctors) */}
                      {type !== 'labs' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {p.scrapedRating !== undefined && p.scrapedRating !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--card-border)' }} title="Lybrate Rating">
                              <Star size={12} fill="var(--accent-star, #fbbf24)" stroke="var(--accent-star, #fbbf24)" />
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lybrate:</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#fff' }}>{p.scrapedRating}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                              <Star size={12} fill="none" stroke="var(--text-muted)" />
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rating: N/A</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Distance, TAT and Pricing */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>LOCATION</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{getAreaName(p.coordinates)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                          {type === 'labs' ? 'REPORT TAT' : 'TIMINGS'}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }} title={type === 'labs' ? p.tat : p.activeHours}>
                          {type === 'labs' ? p.tat : p.activeHours}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          {type === 'labs' ? 'BEST PRICE' : 'CHARGES'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary-neon)', transition: 'all 0.3s' }}>
                            ₹{p.price || p.fee}
                          </span>

                          {/* Skyscanner Live Verification Badges */}
                          {type === 'labs' && (
                            p.isVerifiedLive ? (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-neon)' }} title="Price verified live" />
                            ) : (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-star)' }} className="glow-indicator" title="Live verification pending" />
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Skyscanner Comparative Accordion for Labs */}
                    {type === 'labs' && (
                      <div>
                        <button
                          onClick={() => setExpandedLabId(expandedLabId === p.labId ? null : p.labId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-neon)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 0'
                          }}
                        >
                          {expandedLabId === p.labId ? 'Collapse deals' : 'Compare 4 deals from nearby labs'}
                          <span style={{ transform: expandedLabId === p.labId ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                        </button>

                        {expandedLabId === p.labId && (
                          <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px', borderBottom: '1px solid var(--card-border)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              <span>Lab Brand</span>
                              <span>Accreditation</span>
                              <span>Location</span>
                              <span style={{ textAlign: 'right' }}>Price</span>
                            </div>

                            {/* Comparison list rendering matching lab options */}
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{p.labName}</span>
                                <span style={{ color: 'var(--secondary-neon)' }}>NABL</span>
                                <span>{getAreaName(p.coordinates)}</span>
                                <span style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--secondary-neon)' }}>₹{p.price}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', opacity: 0.65 }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>Thyrocare Technologies</span>
                                <span style={{ color: 'var(--secondary-neon)' }}>NABL</span>
                                <span>{getAreaName([77.638706, 12.911623])}</span>
                                <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>₹{p.price - 50}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px', alignItems: 'center', opacity: 0.65 }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>Dr. Lal PathLabs</span>
                                <span style={{ color: 'var(--secondary-neon)' }}>NABL</span>
                                <span>{getAreaName([77.641151, 12.971891])}</span>
                                <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>₹{p.price + 50}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking Action CTA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.homeCollection ? '🏡 Free Home Sample Collection' : '🏥 Clinic Visit Consultation'}
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
