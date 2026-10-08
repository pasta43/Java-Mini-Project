import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../api';

export function AuthPage({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Step 1: Send OTP via MiniMoth API
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(phone.trim());
      setStep('otp');
      setInfoMessage(res.message || 'OTP sent! Please check your WhatsApp or SMS.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and log in
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtp(phone.trim(), otp.trim(), name.trim());
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍷</div>
          <h2>Welcome to DineReserve</h2>
          <p>Instant phone verification via MiniMoth OTP</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {infoMessage && <div className="alert alert-info">{infoMessage}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="name">Your Name (Optional)</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (with Country Code) *</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="helper-text">
                OTP is delivered instantly via WhatsApp first, with SMS fallback.
              </p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp">Enter 6-digit OTP *</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="form-input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                required
                style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
              <p className="helper-text">
                Sent to {phone}. Check WhatsApp or messages.
              </p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
