import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, FileText, MessageCircle, HeartPulse, CheckCircle, Clock, Calendar, Pill, ClipboardList, Shield } from 'lucide-react';
import Home from './pages/Home';
import SearchHub from './pages/SearchHub';
import ReportAnalyzer from './pages/ReportAnalyzer';
import PrescriptionAnalyzer from './pages/PrescriptionAnalyzer';
import ChatDrawer from './components/ChatDrawer';
import AuthModal from './components/AuthModal';

// Telehealth & Portals Pages
import BookingStepPage from './components/BookingStepPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import TelehealthRoom from './pages/TelehealthRoom';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [activePage, setActivePage] = useState('home'); 
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

  // Booking details
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);



  // Handle Authentication Callbacks
  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);

    // Redirect to correct dashboard based on role
    if (data.user.role === 'admin') {
      setActivePage('admin-dashboard');
    } else if (data.user.role === 'doctor') {
      setActivePage('doctor-dashboard');
    } else {
      setActivePage('patient-dashboard');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActivePage('home');
  };

  const handleSearchTrigger = (params) => {
    setSearchParams(params);
    setActivePage('search');
  };

  const handleSearchSpecialtyFromAI = (specialist) => {
    setSearchParams({
      type: 'doctors',
      query: specialist
    });
    setActivePage('search');
  };

  const handleBookTrigger = (provider) => {
    setSelectedProvider(provider);
    setActivePage('booking-step');
  };

  const handleStartConsultation = (apptId) => {
    setActiveAppointmentId(apptId);
    setActivePage('telehealth-room');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 🧭 Navigation Bar */}
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
            Prescription
          </button>

          {/* Role-Specific Portal Redirect Buttons */}
          {user && (
            user.role === 'admin' ? (
              <button 
                onClick={() => setActivePage('admin-dashboard')}
                style={{
                  background: 'none', border: 'none', color: activePage === 'admin-dashboard' ? '#f43f5e' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Shield size={16} style={{ color: '#f43f5e' }} />
                Admin Dashboard
              </button>
            ) : user.role === 'doctor' ? (
              <button 
                onClick={() => setActivePage('doctor-dashboard')}
                style={{
                  background: 'none', border: 'none', color: activePage === 'doctor-dashboard' ? 'var(--secondary-neon)' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Shield size={16} style={{ color: 'var(--secondary-neon)' }} />
                Doctor Dashboard
              </button>
            ) : (
              <button 
                onClick={() => setActivePage('patient-dashboard')}
                style={{
                  background: 'none', border: 'none', color: activePage === 'patient-dashboard' ? 'var(--primary-neon)' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <ClipboardList size={16} />
                My Dashboard
              </button>
            )
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '0.82rem', 
                color: user.role === 'admin' ? '#f43f5e' : (user.role === 'doctor' ? 'var(--secondary-neon)' : 'var(--primary-neon)'), 
                fontWeight: 600 
              }}>
                {user.role === 'admin' ? '🛡️' : (user.role === 'doctor' ? '🩺' : '👤')} {user.name}
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
                  cursor: 'pointer'
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
          <SearchHub searchParams={searchParams} onBook={handleBookTrigger} />
        )}
        
        {activePage === 'reports' && (
          <ReportAnalyzer onSearchDoctor={handleSearchSpecialtyFromAI} token={token} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        
        {activePage === 'prescription' && (
          <PrescriptionAnalyzer token={token} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}

        {/* 📅 Slot Selection & Booking Page */}
        {activePage === 'booking-step' && selectedProvider && (
          <BookingStepPage
            provider={selectedProvider}
            token={token}
            onCancel={() => setActivePage('search')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* 👤 Patient Portal Page */}
        {activePage === 'patient-dashboard' && (
          <PatientDashboard
            token={token}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onStartConsultation={handleStartConsultation}
          />
        )}

        {/* 🩺 Doctor Portal Dashboard Page */}
        {activePage === 'doctor-dashboard' && (
          <DoctorDashboard
            token={token}
            onStartConsultation={handleStartConsultation}
          />
        )}

        {/* 🛡️ Admin Dashboard Page */}
        {activePage === 'admin-dashboard' && (
          <AdminDashboard
            token={token}
          />
        )}

        {/* 💬 WebRTC Consultation Chat Room */}
        {activePage === 'telehealth-room' && activeAppointmentId && (
          <TelehealthRoom
            appointmentId={activeAppointmentId}
            token={token}
            user={user}
            onBack={() => {
              if (user && user.role === 'doctor') {
                setActivePage('doctor-dashboard');
              } else {
                setActivePage('patient-dashboard');
              }
            }}
          />
        )}

      </main>

      {/* 🤖 Floating Action AI Assistant Trigger */}
      {activePage === 'home' && (
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
      )}

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
