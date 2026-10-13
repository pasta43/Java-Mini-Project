import React, { useState, useEffect } from 'react';
import { getTables, createBooking } from '../api';

export function BookingPage({ user, onNavigateToMyBookings }) {
  const today = new Date().toISOString().split('T')[0];

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState(today);
  const [bookingTime, setBookingTime] = useState('19:00');
  const [guestsCount, setGuestsCount] = useState(2);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const timeSlots = [
    '12:00', '13:00', '14:00', '18:30', '19:30', '20:30', '21:30'
  ];

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBookTable = async (table) => {
    setMessage(null);

    if (guestsCount > table.capacity) {
      setMessage({
        type: 'error',
        text: `Cannot book ${table.table_number}. Max capacity is ${table.capacity} guests (you selected ${guestsCount}).`
      });
      return;
    }

    try {
      setBookingInProgress(table.id);
      await createBooking({
        table_id: table.id,
        booking_date: bookingDate,
        booking_time: bookingTime,
        guests_count: guestsCount
      });

      setMessage({
        type: 'success',
        text: `Successfully reserved ${table.table_number} (${table.location}) for ${bookingDate} at ${bookingTime}!`
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBookingInProgress(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reserve Your Dining Table</h1>
        <p>Select your preferred dining time and choose an ambiance for your party.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          <span>{message.text}</span>
          {message.type === 'success' && (
            <button
              onClick={onNavigateToMyBookings}
              className="btn-secondary"
              style={{ marginLeft: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            >
              View My Bookings →
            </button>
          )}
        </div>
      )}

      {/* Reservation Preferences Bar */}
      <div className="booking-form-bar">
        <div className="filter-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="date">Reservation Date</label>
            <input
              id="date"
              type="date"
              min={today}
              className="form-input"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="time">Time Slot</label>
            <select
              id="time"
              className="form-input"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot} ({parseInt(slot.split(':')[0]) >= 12 ? 'Dinner / Lunch' : 'Morning'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="guests">Number of Guests</label>
            <select
              id="guests"
              className="form-input"
              value={guestsCount}
              onChange={(e) => setGuestsCount(parseInt(e.target.value, 10))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Tables */}
      {loading ? (
        <div className="empty-state">
          <p>Loading restaurant seating...</p>
        </div>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => {
            const isTooSmall = guestsCount > table.capacity;
            const isBookingThis = bookingInProgress === table.id;

            return (
              <div key={table.id} className="table-card">
                <div>
                  <div className="table-card-header">
                    <h3 className="table-name">{table.table_number}</h3>
                    <span className="badge badge-location">{table.location}</span>
                  </div>

                  <div className="table-meta">
                    <div className="table-meta-item">
                      <span>👥 Capacity:</span>
                      <strong>Up to {table.capacity} guests</strong>
                    </div>
                    <div className="table-meta-item">
                      <span>📍 Setting:</span>
                      <span>{table.location}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBookTable(table)}
                  className="btn-primary"
                  disabled={isTooSmall || isBookingThis}
                  style={isTooSmall ? { background: '#9ca3af', cursor: 'not-allowed' } : {}}
                >
                  {isBookingThis
                    ? 'Confirming...'
                    : isTooSmall
                    ? `Requires ≤ ${table.capacity} guests`
                    : 'Reserve Table'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

