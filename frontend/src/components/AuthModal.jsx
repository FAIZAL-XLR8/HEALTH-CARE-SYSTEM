import React, { useState } from 'react';
import { X, Phone, Key, Mail, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.length < 10 || !password.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          onSuccess(data);
          onClose();
          resetForm();
        }, 1000);
      } else {
        setErrorMsg(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone.length < 10 || !password.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password: password,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Account registered successfully! Logging you in...');
        setTimeout(() => {
          onSuccess(data);
          onClose();
          resetForm();
        }, 1000);
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error registering profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setName('');
    setEmail('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(5, 6, 12, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '35px 30px',
        position: 'relative',
        background: 'rgba(13, 17, 29, 0.9)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        boxShadow: '0 10px 40px rgba(6, 182, 212, 0.15)',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        
        {/* Close Button */}
        <button 
          onClick={() => { onClose(); resetForm(); }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
        >
          <X size={20} style={{ pointerEvents: 'none' }} />
        </button>

        {/* Tab Headers */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px', 
          background: 'rgba(0,0,0,0.2)', 
          padding: '4px', 
          borderRadius: '10px', 
          border: '1px solid var(--card-border)',
          marginBottom: '24px' 
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: mode === 'login' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: mode === 'login' ? 'var(--primary-neon)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.3s'
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: mode === 'signup' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: mode === 'signup' ? 'var(--secondary-neon)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.3s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.35rem', color: '#fff', fontWeight: 800 }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'login' 
              ? 'Enter mobile number and password to access your dashboard' 
              : 'Sign up to analyze medical reports and track active diagnostics'
            }
          </p>
        </div>

        {/* Notifications HUD */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: 'var(--accent-alert)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--secondary-neon)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms Container */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Sign Up Fields: Full Name */}
          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={16} />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name *"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '12px 14px 12px 38px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--secondary-neon)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>
          )}

          {/* Common Field: Mobile Number */}
          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={16} />
            <input 
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="10-digit Mobile Number *"
              maxLength="10"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '12px 14px 12px 38px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                letterSpacing: '0.05em',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = mode === 'login' ? 'var(--primary-neon)' : 'var(--secondary-neon)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
            />
          </div>

          {/* Sign Up Fields: Optional Email */}
          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address (Optional)"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '12px 14px 12px 38px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--secondary-neon)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>
          )}

          {/* Common Field: Password */}
          <div style={{ position: 'relative' }}>
            <Key style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} size={16} />
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? "Enter Password *" : "Create Password *"}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '12px 40px 12px 38px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = mode === 'login' ? 'var(--primary-neon)' : 'var(--secondary-neon)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
            />
            {/* Show/Hide Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.4)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading || phone.length < 10 || !password.trim() || (mode === 'signup' && !name.trim())}
            style={{
              background: (phone.length === 10 && password.trim() && (mode === 'login' || name.trim()) && !isLoading) 
                ? (mode === 'login' ? 'var(--primary-neon)' : 'var(--secondary-neon)') 
                : 'rgba(255,255,255,0.05)',
              color: (phone.length === 10 && password.trim() && (mode === 'login' || name.trim()) && !isLoading) 
                ? (mode === 'login' ? '#000' : '#fff') 
                : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: (phone.length === 10 && password.trim() && (mode === 'login' || name.trim()) && !isLoading) ? 'pointer' : 'default',
              transition: 'all 0.2s',
              boxShadow: (phone.length === 10 && password.trim() && (mode === 'login' || name.trim()) && !isLoading) 
                ? (mode === 'login' ? '0 4px 15px rgba(6, 182, 212, 0.25)' : '0 4px 15px rgba(16, 185, 129, 0.25)') 
                : 'none',
              marginTop: '8px'
            }}
          >
            {isLoading 
              ? (mode === 'login' ? 'Logging in...' : 'Registering...') 
              : (mode === 'login' ? 'Login' : 'Create Account & Login')
            }
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
};

export default AuthModal;
