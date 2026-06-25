import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, Shield, AlertTriangle } from 'lucide-react';

const BookingStepPage = ({ provider, token, onCancel, onOpenAuth }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Reservation states
  const [reservedAppt, setReservedAppt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds

  const providerId = provider.labId || provider.doctorId || provider._id;
  const isDoctor = !provider.price;

  const fetchSlots = async () => {
    if (!isDoctor) return; // Lab bookings don't use doctor daily slots
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/slots/${providerId}?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data);
      } else {
        setError(data.message || 'Failed to fetch available slots.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error retrieving slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // Reset selected states on date change
    setSelectedSlot(null);
    setReservedAppt(null);
    setTimeLeft(0);
  }, [selectedDate, providerId]);

  // Reservation countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (reservedAppt) {
        setReservedAppt(null);
        setSelectedSlot(null);
        setError('Your 10-minute reservation has expired. Please select a slot again.');
        fetchSlots();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, reservedAppt]);

  const handleReserve = async () => {
    if (!token) {
      onOpenAuth();
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: providerId,
          date: selectedDate,
          slotTime: selectedSlot
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReservedAppt(data.appointment);
        setTimeLeft(600); // 10 minutes (600 seconds)
      } else {
        setError(data.message || 'Failed to reserve slot.');
      }
    } catch (err) {
      console.error(err);
      setError('Error creating slot reservation.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!reservedAppt) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: reservedAppt._id
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Redirect to Stripe checkout page
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to initialize payment.');
      }
    } catch (err) {
      console.error(err);
      setError('Stripe connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} style={{ color: 'var(--primary-neon)' }} />
            Book Consultation Slot
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Consultation with <strong>{provider.name}</strong> • fee: <strong style={{ color: 'var(--secondary-neon)' }}>₹{provider.fee || provider.price}</strong>
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-alert)', borderRadius: '8px', padding: '12px', color: 'var(--accent-alert)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
            {reservedAppt && (
              <a 
                href={`/api/payments/simulate-checkout?appointmentId=${reservedAppt._id}`}
                style={{ color: 'var(--primary-neon)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '24px' }}
              >
                Click here to launch the local Sandbox Payment Simulator instead
              </a>
            )}
          </div>
        )}

        {/* Date Selector */}
        {!reservedAppt && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              SELECT DATE
            </label>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}

        {/* Slot Grid for Doctors */}
        {isDoctor ? (
          !reservedAppt ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>
                AVAILABLE TIMESLOTS (TODAY)
              </label>
              
              {loading ? (
                <div style={{ color: 'var(--primary-neon)', fontSize: '0.85rem' }}>Loading slots...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {slots.map(s => {
                    const isSelected = selectedSlot === s.slot;
                    return (
                      <button
                        key={s.slot}
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.slot)}
                        style={{
                          background: !s.isAvailable 
                            ? 'rgba(255, 255, 255, 0.02)' 
                            : isSelected 
                              ? 'var(--primary-neon)' 
                              : 'rgba(6, 182, 212, 0.08)',
                          border: isSelected 
                            ? '1px solid var(--primary-neon)' 
                            : '1px solid var(--card-border)',
                          borderRadius: '8px',
                          color: !s.isAvailable 
                            ? 'var(--text-muted)' 
                            : isSelected 
                              ? '#000' 
                              : '#fff',
                          padding: '12px 8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: s.isAvailable ? 1 : 0.4,
                          transition: 'all 0.2s'
                        }}
                      >
                        <Clock size={14} />
                        <span>{s.slot}</span>
                        {!s.isAvailable && (
                          <span style={{ fontSize: '0.62rem', color: 'var(--accent-alert)', fontWeight: 600 }}>
                            {s.reason === 'reserved' ? 'Holding' : 'Booked'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Reserved state count down timer
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--secondary-neon)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%' }}>
                <Clock size={32} style={{ color: 'var(--secondary-neon)' }} />
              </div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Timeslot Temporarily Reserved!</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  The slot <strong>{selectedSlot}</strong> is locked for you. Complete your checkout within:
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-alert)', fontFamily: 'Outfit', marginTop: '10px' }}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Diagnostic tests do not require daily slot selections. You can proceed directly to checkout.
          </div>
        )}

        {/* Buttons / Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            disabled={loading}
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'none',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          
          {reservedAppt ? (
            <button 
              disabled={loading}
              onClick={handlePayment}
              style={{
                flex: 1,
                background: 'var(--secondary-neon)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <CreditCard size={16} />
              Pay with Stripe
            </button>
          ) : (
            <button 
              disabled={loading || !selectedSlot}
              onClick={handleReserve}
              style={{
                flex: 1,
                background: 'var(--primary-neon)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                color: '#000',
                cursor: selectedSlot ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: selectedSlot ? 1 : 0.5,
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
              }}
            >
              <Shield size={16} />
              Reserve & Book
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookingStepPage;
