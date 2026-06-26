import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, MessageSquare, Video, AlertCircle, RefreshCw } from 'lucide-react';

const PatientDashboard = ({ token, onOpenAuth, onStartConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/patient/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data);
      } else {
        setError(data.message || 'Failed to fetch dashboard appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error retrieving appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const handlePayNow = async (apptId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId: apptId })
      });
      const data = await res.json();
      if (res.ok && data.orderId) {
        // Open Razorpay Checkout modal
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Telehealth Consultation",
          description: "Consultation Payment",
          order_id: data.orderId,
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await fetch('/api/payments/verify-checkout-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  appointmentId: apptId
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                alert('Payment verified and appointment confirmed successfully!');
                fetchAppointments();
              } else {
                alert(verifyData.message || 'Payment verification failed.');
              }
            } catch (err) {
              console.error(err);
              alert('Verification error. Please contact support.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: data.patient?.name || '',
            email: data.patient?.email || '',
            contact: data.patient?.phone || ''
          },
          theme: {
            color: '#10b981'
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert(data.message || 'Payment initiation failed.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Razorpay connection error.');
      setLoading(false);
    }
  };

  const getStatusBadge = (appt) => {
    const isExpired = new Date() >= new Date(appt.chatEnabledUntil);
    
    if (appt.paymentStatus === 'pending') {
      return (
        <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-star)', color: 'var(--accent-star)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
          Pending Payment
        </span>
      );
    }
    if (isExpired) {
      return (
        <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
          Expired
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary-neon)', color: 'var(--secondary-neon)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
        Active
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>Patient Dashboard</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage your booked consultations, payments, and active telehealth rooms.
          </p>
        </div>
        
        <button
          onClick={fetchAppointments}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid var(--card-border)',
            color: '#fff',
            padding: '8px 16px',
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
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-alert)', borderRadius: '8px', padding: '16px', color: 'var(--accent-alert)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
        Upcoming Appointments
      </h3>

      {loading && appointments.length === 0 ? (
        <div style={{ color: 'var(--primary-neon)', fontSize: '0.9rem' }}>Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ color: 'var(--card-border)', marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem' }}>No upcoming appointments or reservations found.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Search for doctors on the homepage to book a consultation slot.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {appointments.map(appt => {
            const doc = appt.doctorId || appt.doctor || {};
            const isPaid = appt.paymentStatus === 'paid';
            const isExpired = appt.chatEnabledUntil && new Date() >= new Date(appt.chatEnabledUntil);
            
            return (
              <div key={appt._id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* Doctor Profile Info */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={doc.profileImage || doc.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop'}
                    alt={doc.name}
                    style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{doc.name || 'Seeded Doctor'}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-neon)', fontWeight: 600 }}>
                      {doc.specialization || doc.specialty || 'General Practitioner'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(appt.appointmentDate || appt.date).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {appt.slotTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>STATUS</span>
                  {getStatusBadge(appt)}
                </div>

                {/* Pricing / Payments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CONSULTATION FEE</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--secondary-neon)' }}>₹{appt.amountPaid || appt.amount}</strong>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!isPaid ? (
                    <button
                      onClick={() => handlePayNow(appt._id)}
                      disabled={loading}
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
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
                      }}
                    >
                      <CreditCard size={14} />
                      Pay Now
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onStartConsultation(appt._id)}
                        disabled={isExpired}
                        style={{
                          background: isExpired ? 'rgba(255,255,255,0.05)' : 'var(--secondary-neon)',
                          border: 'none',
                          color: isExpired ? 'var(--text-muted)' : '#fff',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: isExpired ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isExpired ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        <MessageSquare size={14} />
                        Chat & Consultation
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
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

export default PatientDashboard;
