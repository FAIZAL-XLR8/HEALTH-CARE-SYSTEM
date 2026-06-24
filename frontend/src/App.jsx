import React, { useState } from 'react';
import { Home as HomeIcon, FileText, ClipboardList, MessageCircle, HeartPulse, CheckCircle, Clock, Calendar, Pill } from 'lucide-react';
import Home from './pages/Home';
import SearchHub from './pages/SearchHub';
import ReportAnalyzer from './pages/ReportAnalyzer';
import PrescriptionAnalyzer from './pages/PrescriptionAnalyzer';
import LifestyleConsole from './pages/LifestyleConsole';
import ChatDrawer from './components/ChatDrawer';
import AuthModal from './components/AuthModal';
import LiveSimulation from './pages/LiveSimulation';

function App() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'search' | 'reports' | 'prescription' | 'lifestyle' | 'confirmation'
  const [searchParams, setSearchParams] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Booking confirmation states
  const [bookingDetails, setBookingDetails] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingDate, setBookingDate] = useState('2026-05-25');
  const [bookingSlot, setBookingSlot] = useState('10:30 AM');

  // Journey simulation states
  const [simulationParams, setSimulationParams] = useState(null);

  const handleSimulateTrigger = (params) => {
    setSimulationParams(params);
    setActivePage('simulate-journey');
  };

  // Handle Authentication Callbacks
  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActivePage('home');
  };

  // Trigger search from Home Search Console
  const handleSearchTrigger = (params) => {
    setSearchParams(params);
    setActivePage('search');
  };

  // Trigger search dynamically from AI Triage Assistant
  const handleSearchSpecialtyFromAI = (specialist) => {
    setSearchParams({
      type: 'doctors',
      query: specialist,
      location: 'Koramangala, Bengaluru'
    });
    setActivePage('search');
  };

  // Handle Dynamic Appointment Booking
  const handleBookTrigger = (provider) => {
    setSelectedProvider(provider);
    setActivePage('booking-step');
  };

  const executeBooking = async () => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const payload = {
        patientId: user.id || user._id, // Real authenticated User ID
        providerId: selectedProvider.labId || selectedProvider.doctorId,
        type: selectedProvider.price ? 'lab' : 'doctor',
        date: bookingDate,
        slotTime: bookingSlot,
        testsSelected: selectedProvider.price ? [{ testId: searchParams.query, testName: searchParams.query.toUpperCase(), price: selectedProvider.price }] : []
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setBookingDetails(data);
        setActivePage('confirmation');
      } else {
        alert(data.message || 'Booking failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Internal Server Error scheduling appointment.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 🧭 Skyscanner Glassmorphic Navigation Bar */}
      <nav 
        className="glass-panel"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          background: 'rgba(7, 9, 19, 0.75)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div 
          onClick={() => setActivePage('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <HeartPulse size={24} style={{ color: 'var(--primary-neon)' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>
            Aero<span style={{ color: 'var(--primary-neon)' }}>Health</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button 
            onClick={() => setActivePage('home')}
            style={{
              background: 'none', border: 'none', color: activePage === 'home' ? 'var(--primary-neon)' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <HomeIcon size={16} />
            Search
          </button>
          <button 
            onClick={() => setActivePage('reports')}
            style={{
              background: 'none', border: 'none', color: activePage === 'reports' ? 'var(--primary-neon)' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <FileText size={16} />
            Report Locker
          </button>
          <button 
            onClick={() => setActivePage('prescription')}
            style={{
              background: 'none', border: 'none', color: activePage === 'prescription' ? 'var(--primary-neon)' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Pill size={16} />
            Prescription Analyzer
          </button>
          <button 
            onClick={() => setActivePage('lifestyle')}
            style={{
              background: 'none', border: 'none', color: activePage === 'lifestyle' ? 'var(--primary-neon)' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ClipboardList size={16} />
            Lifestyle Console
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--primary-neon)', fontWeight: 600 }}>
                👤 {user.name}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-border)',
                  borderRadius: '6px',
                  color: 'var(--accent-alert)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                background: 'var(--primary-neon)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '6px 16px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.2)'
              }}
            >
              Login / Signup
            </button>
          )}
        </div>
      </nav>

      {/* 🚀 Main Page router view */}
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        {activePage === 'home' && (
          <Home onSearch={handleSearchTrigger} />
        )}
        
        {activePage === 'search' && searchParams && (
          <SearchHub searchParams={searchParams} onBook={handleBookTrigger} onSimulate={handleSimulateTrigger} />
        )}

        {activePage === 'simulate-journey' && simulationParams && (
          <LiveSimulation params={simulationParams} onBack={() => setActivePage('search')} />
        )}
        
        {activePage === 'reports' && (
          <ReportAnalyzer onSearchDoctor={handleSearchSpecialtyFromAI} token={token} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        
        {activePage === 'prescription' && (
          <PrescriptionAnalyzer token={token} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        
        {activePage === 'lifestyle' && (
          <LifestyleConsole token={token} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}

        {/* 📅 Step 1: Select Appointment Slot Panel */}
        {activePage === 'booking-step' && selectedProvider && (
          <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 24px' }}>
            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>Choose Consultation Slot</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Confirming booking details for: <strong>{selectedProvider.labName || selectedProvider.name}</strong>
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Select Date</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Preferred Time Slot</label>
                  <select 
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  >
                    <option value="09:00 AM">09:00 AM (Morning)</option>
                    <option value="10:30 AM">10:30 AM (Morning)</option>
                    <option value="02:30 PM">02:30 PM (Noon)</option>
                    <option value="05:30 PM">05:30 PM (Evening)</option>
                    <option value="07:00 PM">07:00 PM (Late slot)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  onClick={() => setActivePage('search')}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={executeBooking}
                  style={{ flex: 1, background: 'var(--secondary-neon)', border: 'none', borderRadius: '8px', padding: '12px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                >
                  Confirm & Check Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🟢 Step 2: Skyscanner Booking Confirmation Renders */}
        {activePage === 'confirmation' && bookingDetails && (
          <div style={{ maxWidth: '650px', margin: '60px auto', padding: '0 24px' }}>
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '16px' }}>
                <CheckCircle style={{ color: 'var(--secondary-neon)' }} size={32} />
              </div>
              
              <div>
                <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800 }}>Appointment Successfully Confirmed!</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Your spatial booking deal has been locked into the local MERN registry.
                </p>
              </div>

              {/* Real-time Queue Tracking Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderRight: '1px solid var(--card-border)' }}>
                  <Clock style={{ color: 'var(--primary-neon)' }} size={20} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ESTIMATED WAIT</span>
                  <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{bookingDetails.estimatedWaitMinutes} mins</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <ClipboardList style={{ color: 'var(--secondary-neon)' }} size={20} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>QUEUE POSITION</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--secondary-neon)' }}>#{bookingDetails.queueNumber} in Line</strong>
                </div>
              </div>

              {/* Detailed Summary ticket card */}
              <div style={{ width: '100%', borderTop: '1px dashed var(--card-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                  <strong style={{ color: '#fff' }}>{selectedProvider.labName || selectedProvider.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Schedule Time:</span>
                  <strong style={{ color: '#fff' }}>{bookingSlot} on {bookingDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Patient ID:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{user ? (user.id || user._id) : 'Guest'}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSearchParams(null);
                  setActivePage('home');
                }}
                style={{
                  background: 'var(--primary-neon)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '10px',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)'
                }}
              >
                Return to Search Hub
              </button>

            </div>
          </div>
        )}

      </main>

      {/* 🤖 Floating Action AI Stethoscope Assistant Trigger */}
      <button 
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-neon) 0%, #0891b2 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 999,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <MessageCircle size={24} />
      </button>

      {/* Floating Chat Drawer Triage Assistant */}
      <ChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onSearchSpecialty={handleSearchSpecialtyFromAI}
        onBook={handleBookTrigger}
      />


      {/* Authentication and Registration Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}

export default App;
