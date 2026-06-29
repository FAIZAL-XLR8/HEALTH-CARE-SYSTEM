import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar, Briefcase, FileText, CheckCircle, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ user: initialUser, token, onBack }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);

  // Fetch full details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const fullData = await res.json();
          console.log('👤 [Profile] Fetched full user details:', fullData);
          setUser(fullData);
        }
      } catch (err) {
        console.error('Failed fetching full profile details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  if (loading && !user) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '100px 24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>Loading Profile Details...</h2>
      </div>
    );
  }

  // Format date utility
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper to check if string looks like an image URL
  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp)/i.test(url) || url.includes('cloudinary');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', color: '#fff' }}>
      
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary-neon)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          marginBottom: '24px',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Hero Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{
          padding: '32px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '30px',
          background: 'rgba(13, 17, 29, 0.4)',
          border: '1px solid var(--card-border)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--primary-neon)',
          overflow: 'hidden'
        }}>
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={40} style={{ color: 'var(--primary-neon)' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{user.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{
              background: user.role === 'doctor' ? 'var(--secondary-neon)' : 'var(--primary-neon)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              {user.role}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Member since {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {user.role === 'doctor' && (
          <div style={{
            background: user.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${user.status === 'approved' ? 'var(--secondary-neon)' : '#f59e0b'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: user.status === 'approved' ? 'var(--secondary-neon)' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle size={14} />
            Status: {user.status ? user.status.toUpperCase() : 'PENDING'}
          </div>
        )}
      </motion.div>

      {/* Grid Layout for details */}
      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'doctor' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '30px' }}>
        
        {/* Left Side Column: Core Credentials */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel"
          style={{ padding: '24px', borderRadius: '16px', background: 'rgba(13, 17, 29, 0.2)', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary-neon)' }} />
            Account Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{user.name}</span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                {user.email}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                {user.phone || 'Not Provided'}
              </span>
            </div>

            {user.dateOfBirth && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Date of Birth</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  {formatDate(user.dateOfBirth)}
                </span>
              </div>
            )}

            {user.gender && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Gender</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{user.gender}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Side Column: Doctor Professional Credentials */}
        {user.role === 'doctor' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel"
            style={{ padding: '24px', borderRadius: '16px', background: 'rgba(13, 17, 29, 0.2)', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} style={{ color: 'var(--secondary-neon)' }} />
              Professional Credentials
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Specialization</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{user.specialization}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Experience</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{user.experienceYears} Years</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Consultation Fee</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--secondary-neon)' }}>₹{user.consultationFee}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Active Hours</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {user.activeHours}
                  </span>
                </div>
              </div>

              {user.clinicName && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Clinic Address</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{user.clinicName}</span>
                </div>
              )}

              {user.bio && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Biography</span>
                  <span style={{ fontSize: '0.88rem', color: '#e5e7eb', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{user.bio}"
                  </span>
                </div>
              )}

              {user.location && user.location.coordinates && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Map Coordinates</span>
                  <span style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} style={{ color: 'var(--secondary-neon)' }} />
                    Longitude: {user.location.coordinates[0].toFixed(6)}, Latitude: {user.location.coordinates[1].toFixed(6)}
                  </span>
                </div>
              )}

              {/* Government ID Section */}
              <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Verification Proof (Government ID)</span>
                {user.governmentIdUrl ? (
                  isImageUrl(user.governmentIdUrl) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ width: '100%', height: '140px', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden', background: '#000', position: 'relative' }}>
                        <img src={user.governmentIdUrl} alt="Government ID Proof" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <a 
                        href={user.governmentIdUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary-neon)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <FileText size={12} />
                        Open full document proof
                      </a>
                    </div>
                  ) : (
                    <a 
                      href={user.governmentIdUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        color: 'var(--primary-neon)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontWeight: 600,
                        width: 'fit-content'
                      }}
                    >
                      <FileText size={16} />
                      View Uploaded ID File
                    </a>
                  )
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-alert)', fontWeight: 600 }}>
                    No government ID uploaded yet.
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default Profile;
