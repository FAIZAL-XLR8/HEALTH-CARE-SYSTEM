import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, Users, CheckCircle, RefreshCw, AlertCircle, FileText, CreditCard, Shield, AlertTriangle } from 'lucide-react';

const DoctorDashboard = ({ token, onStartConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('todays'); // 'todays' | 'upcoming' | 'active-chats' | 'past' | 'patients' | 'stripe-setup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [stripeSuccess, setStripeSuccess] = useState('');

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/doctor/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
        setDoctorProfile(data.doctorProfile || null);
      } else {
        setError(data.message || 'Failed to load Doctor Dashboard.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleStripeOnboard = async () => {
    setStripeLoading(true);
    setStripeError('');
    setStripeSuccess('');
    try {
      const res = await fetch('/api/payments/onboard-doctor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.message || 'Failed to initiate Stripe onboarding.');
      }
    } catch (err) {
      setStripeError('Network error starting onboarding.');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleCheckStripeStatus = async () => {
    setStripeLoading(true);
    setStripeError('');
    setStripeSuccess('');
    try {
      const res = await fetch('/api/payments/onboard-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.stripeOnboardingCompleted) {
          setStripeSuccess('Stripe onboarding completed successfully!');
          fetchDashboardData();
        } else {
          setStripeError('Stripe onboarding is still incomplete. Please complete all verification steps.');
        }
      } else {
        setStripeError(data.message || 'Failed to check onboarding status.');
      }
    } catch (err) {
      setStripeError('Network error checking status.');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setStripeLoading(true);
    setStripeError('');
    setStripeSuccess('');
    try {
      const res = await fetch('/api/payments/create-platform-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStripeSuccess('Platform subscription activated successfully!');
        fetchDashboardData();
      } else {
        setStripeError(data.message || 'Failed to activate platform subscription.');
      }
    } catch (err) {
      setStripeError('Network error activating subscription.');
    } finally {
      setStripeLoading(false);
    }
  };

  const now = new Date();
  
  // Categorize appointments
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date();
  endOfToday.setHours(23,59,59,999);

  const todaysAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    return apptDate >= startOfToday && apptDate <= endOfToday;
  });

  const upcomingAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    return apptDate > endOfToday;
  });

  const activeChats = appointments.filter(appt => {
    const isExpired = appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil);
    return appt.paymentStatus === 'paid' && !isExpired;
  });

  const pastConsultations = appointments.filter(appt => {
    const isExpired = appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil);
    return isExpired || appt.status === 'completed' || appt.status === 'cancelled';
  });

  // Unique patient list extraction
  const patientsMap = new Map();
  appointments.forEach(appt => {
    const p = appt.userId;
    if (p && !patientsMap.has(p._id)) {
      patientsMap.set(p._id, {
        ...p,
        lastVisit: appt.date,
        totalBookings: appointments.filter(a => a.userId?._id === p._id).length
      });
    }
  });
  const patientsList = Array.from(patientsMap.values());

  const getActiveList = () => {
    switch (activeTab) {
      case 'todays': return todaysAppointments;
      case 'upcoming': return upcomingAppointments;
      case 'active-chats': return activeChats;
      case 'past': return pastConsultations;
      default: return [];
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {doctorProfile && (
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
              Welcome, {doctorProfile.name}
            </h2>
          )}
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage appointments, connect with active consultations, and view patient health history.
          </p>
        </div>
        
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid var(--card-border)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          Refresh Dashboard
        </button>
      </div>

      {doctorProfile && (!doctorProfile.stripeOnboardingCompleted || !doctorProfile.stripeSubscriptionActive) && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #fbbf24', borderRadius: '12px', padding: '16px', color: '#fbbf24', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Action Required: Complete your Stripe Payments setup and subscribe to start accepting consults.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('stripe-setup')}
            style={{
              background: '#fbbf24',
              color: '#05060c',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Setup Payments
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-alert)', borderRadius: '8px', padding: '16px', color: 'var(--accent-alert)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--card-border)', marginBottom: '24px', flexWrap: 'wrap', paddingBottom: '4px' }}>
        {[
          { id: 'todays', label: `Today's Appointments (${todaysAppointments.length})` },
          { id: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
          { id: 'active-chats', label: `Active Chats (${activeChats.length})` },
          { id: 'past', label: `Past Consultations (${pastConsultations.length})` },
          { id: 'patients', label: `Patient List (${patientsList.length})` },
          { id: 'stripe-setup', label: 'Payments & Subscription' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-neon)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-neon)' : 'var(--text-muted)',
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Render Views */}
      {activeTab === 'stripe-setup' ? (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--primary-neon)' }} />
            Stripe Connected Payments & Platform Subscriptions
          </h3>

          {stripeError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-alert)', borderRadius: '8px', padding: '12px', color: 'var(--accent-alert)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{stripeError}</span>
              </div>
              <a 
                href={`/api/payments/simulate-onboarding?doctorId=${doctorProfile?._id}`}
                style={{ color: 'var(--primary-neon)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '24px' }}
              >
                Click here to launch the local Sandbox Onboarding Simulator instead
              </a>
            </div>
          )}

          {stripeSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary-neon)', borderRadius: '8px', padding: '12px', color: 'var(--secondary-neon)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} />
              <span>{stripeSuccess}</span>
            </div>
          )}

          {/* Onboarding Box */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--primary-neon)' }} />
              Step 1: Stripe Merchant Onboarding
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Enable your medical practice to securely accept card payments from patients. We use Stripe Accounts v2 to route consultations directly to your account.
            </p>
            {doctorProfile?.stripeOnboardingCompleted ? (
              <div style={{ color: 'var(--secondary-neon)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} />
                Connected Stripe Account Setup Complete (ID: {doctorProfile.stripeAccountId})
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  style={{
                    background: 'var(--primary-neon)',
                    border: 'none',
                    color: '#000',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                    opacity: stripeLoading ? 0.6 : 1
                  }}
                >
                  {stripeLoading ? 'Connecting...' : doctorProfile?.stripeAccountId ? 'Continue Stripe Setup' : 'Configure Stripe Payments'}
                </button>
                {doctorProfile?.stripeAccountId && (
                  <button
                    onClick={handleCheckStripeStatus}
                    disabled={stripeLoading}
                    style={{
                      background: 'none',
                      border: '1px solid var(--card-border)',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      opacity: stripeLoading ? 0.6 : 1
                    }}
                  >
                    Check Onboarding Status
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subscription Box */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} style={{ color: 'var(--primary-neon)' }} />
              Step 2: Platform Subscription
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Subscribe to the AeroHealth monthly practitioner plan (₹1000/month) using your Stripe balance to unlock patient chat and consultations.
            </p>
            {!doctorProfile?.stripeOnboardingCompleted ? (
              <div style={{ color: 'var(--accent-alert)', fontSize: '0.82rem', fontWeight: 600 }}>
                Please complete Step 1 (Stripe Onboarding) first to enable subscriptions.
              </div>
            ) : doctorProfile?.stripeSubscriptionActive ? (
              <div style={{ color: 'var(--secondary-neon)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} />
                Platform Subscription is Active (ID: {doctorProfile.stripeSubscriptionId})
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={stripeLoading}
                style={{
                  background: 'var(--secondary-neon)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  opacity: stripeLoading ? 0.6 : 1
                }}
              >
                {stripeLoading ? 'Activating...' : 'Activate Monthly Subscription'}
              </button>
            )}
          </div>
        </div>
      ) : activeTab === 'patients' ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--primary-neon)' }} />
            Patient Records
          </h3>

          {patientsList.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No registered patients found in your records.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {patientsList.map(p => (
                <div key={p._id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={p.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
                    alt={p.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
                  />
                  <div>
                    <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phone: {p.phone}</p>
                    <p style={{ color: 'var(--primary-neon)', fontSize: '0.72rem', marginTop: '4px', fontWeight: 600 }}>
                      Visited {p.totalBookings} times • Last: {new Date(p.lastVisit).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loading && getActiveList().length === 0 ? (
            <div style={{ color: 'var(--primary-neon)', fontSize: '0.9rem' }}>Loading appointments...</div>
          ) : getActiveList().length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ color: 'var(--card-border)', marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem' }}>No appointments found in this section.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {getActiveList().map(appt => {
                const patient = appt.userId || {};
                const isExpired = appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil);

                return (
                  <div key={appt._id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    
                    {/* Patient detail */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img
                        src={patient.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
                        alt={patient.name}
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                          {patient.name || 'Seeded Patient'}
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <span>📞 {patient.phone || 'N/A'}</span>
                          <span style={{ color: 'var(--primary-neon)' }}>ID: {patient._id ? patient._id.toString().substring(0, 8) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking slot time details */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TIMESLOT</span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: 'var(--primary-neon)' }} />
                        {new Date(appt.date).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Clock size={12} style={{ color: 'var(--primary-neon)' }} />
                        {appt.slotTime}
                      </span>
                    </div>

                    {/* Payment details */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PAYMENT STATUS</span>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--secondary-neon)' }}>
                        PAID (₹{appt.amount})
                      </strong>
                    </div>

                    {/* Actions */}
                    <div>
                      {activeTab === 'active-chats' || (appt.paymentStatus === 'paid' && !isExpired) ? (
                        <button
                          onClick={() => onStartConsultation(appt._id)}
                          style={{
                            background: 'var(--primary-neon)',
                            border: 'none',
                            color: '#000',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
                          }}
                        >
                          <MessageSquare size={14} />
                          Consult Room
                        </button>
                      ) : isExpired ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} style={{ color: 'var(--text-muted)' }} />
                          Completed
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Upcoming Appointment
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default DoctorDashboard;
