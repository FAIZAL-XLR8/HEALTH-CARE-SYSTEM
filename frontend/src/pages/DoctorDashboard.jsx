import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, Users, CheckCircle, RefreshCw, AlertCircle, FileText, CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Framer Motion variants — same pattern as Home.jsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const headingVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const descriptionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { y: -5, transition: { duration: 0.22, ease: 'easeInOut' } },
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} yrs`;
};

const DoctorDashboard = ({ onStartConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('todays'); // 'todays' | 'upcoming' | 'active-chats' | 'past' | 'patients'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/doctor/dashboard', {
        credentials: 'include'
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
  }, []);


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
    const isExpired = appt.remainingValidity === 'Expired' || (appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil));
    return appt.paymentStatus === 'paid' && !isExpired;
  });

  const pastConsultations = appointments.filter(appt => {
    const isExpired = appt.remainingValidity === 'Expired' || (appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil));
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}
    >
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {doctorProfile && (
            <motion.h2
              variants={headingVariants}
              initial="hidden"
              animate="visible"
              style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}
            >
              Welcome, {doctorProfile.name}
            </motion.h2>
          )}
          <motion.p
            variants={descriptionVariants}
            initial="hidden"
            animate="visible"
            style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}
          >
            Manage appointments, connect with active consultations, and view patient health history.
          </motion.p>
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
          { id: 'patients', label: `Patient List (${patientsList.length})` }
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
      {activeTab === 'patients' ? (
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
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}
            >
              {patientsList.map(p => (
                <motion.div key={p._id} variants={cardVariants} whileHover="hover" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                </motion.div>
              ))}
            </motion.div>
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
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {getActiveList().map(appt => {
                const patient = appt.userId || {};
                const isExpired = appt.remainingValidity === 'Expired' || (appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil));

                return (
                  <motion.div key={appt._id} variants={cardVariants} whileHover="hover" className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    
                    {/* Patient detail */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img
                        src={patient.profilePhoto || patient.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
                        alt={appt.patientName || patient.name}
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                          {appt.patientName || patient.name || 'Seeded Patient'}
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <span>📞 {patient.phone || 'N/A'}</span>
                          <span>Age: {appt.patientAge ? `${appt.patientAge} yrs` : calculateAge(patient.dateOfBirth)}</span>
                          <span>Gender: {appt.patientGender || patient.gender || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking slot time details */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TIMESLOT</span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: 'var(--primary-neon)' }} />
                        {new Date(appt.appointmentDate || appt.date).toLocaleDateString('en-GB')}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Clock size={12} style={{ color: 'var(--primary-neon)' }} />
                        {appt.slotTime}
                      </span>
                    </div>

                    {/* Booking Date & Time */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>BOOKED ON</span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: 'var(--primary-neon)' }} />
                        {appt.bookingTime ? new Date(appt.bookingTime).toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Clock size={12} style={{ color: 'var(--primary-neon)' }} />
                        {appt.bookingTime ? new Date(appt.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>

                    {/* Payment details */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PAYMENT STATUS</span>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--secondary-neon)' }}>
                        PAID (₹{appt.amountPaid || appt.amount})
                      </strong>
                    </div>

                    {/* Consultation Validity */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>VALIDITY</span>
                      {isExpired ? (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          Expired
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary-neon)', color: 'var(--secondary-neon)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          {appt.remainingValidity || 'Active'}
                        </span>
                      )}
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

                  </motion.div>
                );
              })}
            </motion.div>
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
    </motion.div>
  );
};

export default DoctorDashboard;
