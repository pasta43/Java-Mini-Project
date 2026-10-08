import React, { useState, useEffect } from 'react';
import { getMyBookings } from '../api';

export function MyBookingsPage({ onNavigateToBook }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Your confirmed dining bookings at DineReserve.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <p>Loading your reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3>No Reservations Found</h3>
          <p>You haven't booked any restaurant tables yet.</p>
          <button onClick={onNavigateToBook} className="btn-primary" style={{ maxWidth: '240px' }}>
            Book a Table Now
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-item">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h3 className="booking-item-title">{booking.table_number}</h3>
                  <span className="badge badge-location">{booking.location}</span>
                  <span className="badge badge-status">Confirmed</span>
                </div>

                <div className="booking-item-meta">
                  <div>📅 <strong>Date:</strong> {booking.booking_date}</div>
                  <div>⏰ <strong>Time:</strong> {booking.booking_time}</div>
                  <div>👥 <strong>Guests:</strong> {booking.guests_count} Person(s)</div>
                  <div>🔖 <strong>Booking ID:</strong> #{booking.id}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
