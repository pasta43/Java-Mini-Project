import React, { useState, useEffect } from 'react';
import { AuthPage } from './pages/AuthPage';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';

export function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('booking'); // 'booking' | 'my-bookings'

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('booking');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('booking');
  };

  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand" onClick={() => user && setCurrentPage('booking')}>
            <span className="brand-icon">🍽️</span>
            <span className="brand-title">DineReserve</span>
          </div>

          {user && (
            <div className="nav-links">
              <button
                className={`nav-btn ${currentPage === 'booking' ? 'active' : ''}`}
                onClick={() => setCurrentPage('booking')}
              >
                Reserve Table
              </button>

              <button
                className={`nav-btn ${currentPage === 'my-bookings' ? 'active' : ''}`}
                onClick={() => setCurrentPage('my-bookings')}
              >
                My Bookings
              </button>

              <span className="user-tag">
                👤 {user.name || user.phone}
              </span>

              <button className="logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Pages (Maximum 3) */}
      <main>
        {!user ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : currentPage === 'booking' ? (
          <BookingPage
            user={user}
            onNavigateToMyBookings={() => setCurrentPage('my-bookings')}
          />
        ) : (
          <MyBookingsPage
            onNavigateToBook={() => setCurrentPage('booking')}
          />
        )}
      </main>
    </div>
  );
}

export default App;

