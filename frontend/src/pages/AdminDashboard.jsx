import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, Phone, Mail, User, Briefcase, IndianRupee, Clock } from 'lucide-react';

const AdminDashboard = ({ token }) => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [showRejectInput, setShowRejectInput] = useState({});

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDoctors(data);
      } else {
        setError(data.message || 'Failed to fetch doctor profiles.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading doctor applications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Doctor application approved successfully.');
        fetchDoctors();
      } else {
        alert(data.message || 'Failed to approve doctor.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to approve doctor.');
    }
  };

  const handleRejectSubmit = async (doctorId) => {
    const reason = rejectionReasons[doctorId];
    if (!reason || !reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Doctor application rejected. Simulated notification email logged.');
        // Clear input states
        setRejectionReasons(prev => ({ ...prev, [doctorId]: '' }));
        setShowRejectInput(prev => ({ ...prev, [doctorId]: false }));
        fetchDoctors();
      } else {
        alert(data.message || 'Failed to reject doctor.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to reject doctor.');
    }
  };

  const handleSuspend = async (doctorId) => {
    if (!window.confirm('Are you sure you want to suspend this doctor account? They will lose access immediately.')) return;
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Doctor account suspended.');
        fetchDoctors();
      } else {
        alert(data.message || 'Failed to suspend doctor.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to suspend doctor.');
    }
  };

  const pendingDocs = doctors.filter(d => d.status === 'pending');
  const activeDocs = doctors.filter(d => d.status === 'approved');
  const rejectedDocs = doctors.filter(d => d.status === 'rejected');
  const suspendedDocs = doctors.filter(d => d.status === 'suspended');

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '0 24px',
      fontFamily: 'Outfit, sans-serif',
      color: '#fff'
    }}>
      {/* Header HUD */}
      <div className="glass-panel" style={{
        padding: '30px',
        marginBottom: '30px',
        background: 'linear-gradient(135deg, rgba(13, 17, 29, 0.75) 0%, rgba(22, 28, 45, 0.75) 100%)',
        border: '1px solid rgba(244, 63, 94, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Shield size={32} style={{ color: '#f43f5e' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #ffffff, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Verification Authority Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Review, verify credentials, examine uploaded IDs, and approve or reject medical doctor applications.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-neon)' }}>{pendingDocs.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-neon)' }}>{activeDocs.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-alert)', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(244,63,94,0.1)', borderTopColor: '#f43f5e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading doctor applications matrix...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* 🌟 1. Pending Verification Section */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--primary-neon)' }}>
              <span>⏳</span> Pending Applications ({pendingDocs.length})
            </h2>
            {pendingDocs.length === 0 ? (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed' }}>
                No pending doctor applications awaiting verification.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {pendingDocs.map(doc => (
                  <DoctorCard 
                    key={doc._id} 
                    doc={doc} 
                    onApprove={handleApprove}
                    onRejectSubmit={handleRejectSubmit}
                    onSuspend={handleSuspend}
                    rejectionReason={rejectionReasons[doc._id] || ''}
                    setRejectionReason={(val) => setRejectionReasons(prev => ({ ...prev, [doc._id]: val }))}
                    showRejectInput={showRejectInput[doc._id]}
                    setShowRejectInput={(val) => setShowRejectInput(prev => ({ ...prev, [doc._id]: val }))}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 🩺 2. Active Approved Doctors Section */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--secondary-neon)' }}>
              <span>✅</span> Approved Doctors ({activeDocs.length})
            </h2>
            {activeDocs.length === 0 ? (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed' }}>
                No approved doctor accounts found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {activeDocs.map(doc => (
                  <DoctorCardMini key={doc._id} doc={doc} onSuspend={handleSuspend} />
                ))}
              </div>
            )}
          </section>

          {/* ❌ 3. Rejected & Suspended Accounts */}
          {(rejectedDocs.length > 0 || suspendedDocs.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <section>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-alert)' }}>
                  <span>🚫</span> Rejected ({rejectedDocs.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rejectedDocs.map(doc => (
                    <DoctorCardArchive key={doc._id} doc={doc} type="rejected" onApprove={handleApprove} />
                  ))}
                </div>
              </section>
              <section>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#eab308' }}>
                  <span>⚠️</span> Suspended ({suspendedDocs.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {suspendedDocs.map(doc => (
                    <DoctorCardArchive key={doc._id} doc={doc} type="suspended" onApprove={handleApprove} />
                  ))}
                </div>
              </section>
            </div>
          )}

        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .spinner {
          border-right-color: transparent;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

// Component for a full pending application
const DoctorCard = ({ doc, onApprove, onRejectSubmit, rejectionReason, setRejectionReason, showRejectInput, setShowRejectInput }) => {
  return (
    <div className="glass-panel" style={{
      padding: '24px',
      background: 'rgba(17, 24, 39, 0.85)',
      border: '1px solid rgba(6, 182, 212, 0.15)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Profile summary */}
      <div style={{ display: 'flex', justifyContext: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img 
            src={doc.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${doc.name}`} 
            alt="Doctor" 
            style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }}
          />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>Dr. {doc.name}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--primary-neon)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{doc.specialization}</span>
              <span style={{ color: 'var(--text-muted)' }}>📍 {doc.clinicName || 'Clinic unassigned'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-neon)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Email Verified: {doc.emailVerified ? 'YES' : 'NO'}
          </span>
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-neon)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Phone Verified: {doc.phoneVerified ? 'YES' : 'NO'}
          </span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: 0 }} />

      {/* Credentials Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
          <span><strong>Experience:</strong> {doc.experienceYears} Years</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IndianRupee size={16} style={{ color: 'var(--text-muted)' }} />
          <span><strong>Fee:</strong> ₹{doc.consultationFee} INR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} style={{ color: 'var(--text-muted)' }} />
          <span><strong>Email:</strong> {doc.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} style={{ color: 'var(--text-muted)' }} />
          <span><strong>Phone:</strong> {doc.phone || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: 'var(--text-muted)' }} />
          <span><strong>Hours:</strong> {doc.activeHours}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} style={{ color: 'var(--secondary-neon)' }} />
          <span>
            <strong>Govt ID Proof:</strong>{' '}
            {doc.governmentIdUrl ? (
              <a href={doc.governmentIdUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary-neon)', textDecoration: 'underline', fontWeight: 600 }}>
                View Uploaded Document
              </a>
            ) : (
              <span style={{ color: 'var(--accent-alert)' }}>Missing Upload</span>
            )}
          </span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: 0 }} />

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onApprove(doc._id)}
            style={{
              flex: 1,
              background: 'var(--secondary-neon)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <CheckCircle size={16} /> Approve Doctor
          </button>
          
          <button
            onClick={() => setShowRejectInput(!showRejectInput)}
            style={{
              flex: 1,
              background: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--accent-alert)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(244, 63, 94, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(244, 63, 94, 0.1)'}
          >
            <XCircle size={16} /> Reject Application
          </button>
        </div>

        {showRejectInput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provide Rejection Reason (Email simulation will notify them) *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Uploaded government ID proof is blurry / invalid"
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => onRejectSubmit(doc._id)}
                style={{
                  background: 'var(--accent-alert)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini approved doctor card
const DoctorCardMini = ({ doc, onSuspend }) => {
  return (
    <div className="glass-panel" style={{
      padding: '16px',
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <img 
          src={doc.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${doc.name}`} 
          alt="Doc Mini" 
          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
        />
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Dr. {doc.name}</h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.specialization} • experience: {doc.experienceYears} yrs</span>
        </div>
      </div>
      <button
        onClick={() => onSuspend(doc._id)}
        style={{
          background: 'none',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '6px',
          color: '#eab308',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '6px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.target.style.background = 'rgba(234,179,8,0.1)'; }}
        onMouseLeave={(e) => { e.target.style.background = 'none'; }}
      >
        Suspend
      </button>
    </div>
  );
};

// Archived card (rejected / suspended)
const DoctorCardArchive = ({ doc, type, onApprove }) => {
  return (
    <div className="glass-panel" style={{
      padding: '12px 14px',
      background: 'rgba(255, 255, 255, 0.01)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Dr. {doc.name}</span>
        <button
          onClick={() => onApprove(doc._id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--secondary-neon)',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '2px 6px',
            textDecoration: 'underline'
          }}
        >
          Re-Approve
        </button>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Specialty: {doc.specialization}</span>
      {type === 'rejected' && doc.rejectionReason && (
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-alert)', background: 'rgba(244,63,94,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
          <strong>Reason:</strong> "{doc.rejectionReason}"
        </span>
      )}
    </div>
  );
};

export default AdminDashboard;
