require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_secret_key_45min';
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY || 'mock';

app.use(express.json());

// Basic CORS headers to allow frontend access without external cors package
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------
// ENDPOINT 1: POST /api/auth/send-otp
// Dispatches OTP via MiniMoth API or mock fallback for workshop
// -------------------------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required (e.g. +919876543210)' });
    }

    const cleanPhone = phone.trim();

    // Live MiniMoth API integration
    if (MINIMOTH_API_KEY && MINIMOTH_API_KEY !== 'mock' && MINIMOTH_API_KEY !== 'demo') {
      const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
        method: 'POST',
        headers: {
          'X-Api-Key': MINIMOTH_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || 'Failed to send OTP via Minimoth'
        });
      }

      return res.json({
        success: true,
        message: 'OTP sent via Minimoth (WhatsApp / SMS)',
        otp_id: data.otp_id
      });
    }

    // Workshop Dev Mode fallback (when API key is 'mock' or not yet configured)
    console.log(`[MiniMoth Dev Mode] Mock OTP sent to ${cleanPhone}. Dev code: 123456`);
    return res.json({
      success: true,
      message: 'OTP sent successfully! (Dev Mode: Use 123456)',
      dev_otp: '123456'
    });
  } catch (error) {
    console.error('Error in /api/auth/send-otp:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while sending OTP' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 2: POST /api/auth/verify-otp
// Verifies OTP with MiniMoth, registers/logs in user, returns JWT
// -------------------------------------------------------------
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Phone and 6-digit OTP code are required' });
    }

    const cleanPhone = phone.trim();
    const cleanCode = String(code).trim();

    // Live MiniMoth API verification
    if (MINIMOTH_API_KEY && MINIMOTH_API_KEY !== 'mock' && MINIMOTH_API_KEY !== 'demo') {
      const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
        method: 'POST',
        headers: {
          'X-Api-Key': MINIMOTH_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || 'Invalid OTP code from Minimoth'
        });
      }
    } else {
      // Dev Mode verification
      if (cleanCode !== '123456') {
        return res.status(400).json({ success: false, error: 'Invalid OTP code. In dev mode, use 123456' });
      }
    }

    // Find or create User in SQLite
    let user = db.prepare('SELECT id, phone, name FROM users WHERE phone = ?').get(cleanPhone);

    if (!user) {
      const displayName = (name && name.trim()) ? name.trim() : 'Guest Diners';
      const insert = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(cleanPhone, displayName);
      user = { id: Number(insert.lastInsertRowid), phone: cleanPhone, name: displayName };
    } else if (name && name.trim()) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), user.id);
      user.name = name.trim();
    }

    // Generate JWT auth token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Error in /api/auth/verify-otp:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 3: GET /api/tables
// Returns list of restaurant tables with capacity and location
// -------------------------------------------------------------
app.get('/api/tables', (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM restaurant_tables ORDER BY id ASC').all();
    return res.json({ success: true, tables });
  } catch (error) {
    console.error('Error in GET /api/tables:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve tables' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 4: POST /api/bookings
// Reserves a table for the authenticated user
// -------------------------------------------------------------
app.post('/api/bookings', authenticateToken, (req, res) => {
  try {
    const { table_id, booking_date, booking_time, guests_count } = req.body;

    if (!table_id || !booking_date || !booking_time || !guests_count) {
      return res.status(400).json({
        success: false,
        error: 'Table, booking date, booking time, and guests count are required'
      });
    }

    const guests = parseInt(guests_count, 10);
    if (isNaN(guests) || guests <= 0) {
      return res.status(400).json({ success: false, error: 'Guests count must be a positive number' });
    }

    // Verify table exists
    const table = db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(Number(table_id));
    if (!table) {
      return res.status(404).json({ success: false, error: 'Selected table does not exist' });
    }

    // Validate table capacity
    if (guests > table.capacity) {
      return res.status(400).json({
        success: false,
        error: `${table.table_number} can seat up to ${table.capacity} guests only (requested: ${guests})`
      });
    }

    // Check for double booking conflict
    const conflict = db.prepare(
      'SELECT id FROM bookings WHERE table_id = ? AND booking_date = ? AND booking_time = ? AND status = ?'
    ).get(Number(table_id), booking_date, booking_time, 'confirmed');

    if (conflict) {
      return res.status(400).json({
        success: false,
        error: `${table.table_number} is already booked for ${booking_date} at ${booking_time}. Please pick another time or table.`
      });
    }

    // Create reservation
    const insertBooking = db.prepare(
      'INSERT INTO bookings (user_id, table_id, booking_date, booking_time, guests_count, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, Number(table_id), booking_date, booking_time, guests, 'confirmed');

    return res.status(201).json({
      success: true,
      message: 'Table booked successfully!',
      booking_id: Number(insertBooking.lastInsertRowid)
    });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 5: GET /api/bookings/my
// Returns all bookings made by the currently authenticated user
// -------------------------------------------------------------
app.get('/api/bookings/my', authenticateToken, (req, res) => {
  try {
    const userBookings = db.prepare(`
      SELECT 
        b.id,
        b.booking_date,
        b.booking_time,
        b.guests_count,
        b.status,
        b.created_at,
        t.id as table_id,
        t.table_number,
        t.location,
        t.capacity
      FROM bookings b
      JOIN restaurant_tables t ON b.table_id = t.id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
    `).all(req.user.id);

    return res.json({ success: true, bookings: userBookings });
  } catch (error) {
    console.error('Error in GET /api/bookings/my:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve bookings' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`[Server] Restaurant Table Booking backend running on http://localhost:${PORT}`);
  console.log(`[Server] Minimoth API Key status: ${MINIMOTH_API_KEY === 'mock' ? 'MOCK DEV MODE (Default OTP 123456)' : 'LIVE CONFIGURED'}`);
});

