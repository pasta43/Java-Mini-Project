const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders(includeAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function sendOtp(phone) {
  const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ phone })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
}

export async function verifyOtp(phone, code, name) {
  const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ phone, code, name })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }
  return data;
}

export async function getTables() {
  const res = await fetch(`${API_BASE}/api/tables`, {
    method: 'GET',
    headers: getHeaders(false)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch restaurant tables');
  }
  return data.tables;
}

export async function createBooking(bookingData) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(bookingData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to complete booking');
  }
  return data;
}

export async function getMyBookings() {
  const res = await fetch(`${API_BASE}/api/bookings/my`, {
    method: 'GET',
    headers: getHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch bookings');
  }
  return data.bookings;
}

