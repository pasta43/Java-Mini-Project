# Restaurant Table Booking (DineReserve) 🍽️

A clean, full-stack 45-minute workshop project for reserving restaurant tables with WhatsApp/SMS OTP authentication powered by **MiniMoth API**.

Built with **React (Vite)** on the frontend and **Node.js (Express + native SQLite)** on the backend.

---

## 📌 Workshop Scope & Specifications

* **Frontend Pages (Strictly 3)**:
  1. **Login & Register (`AuthPage`)**: Phone number entry, MiniMoth OTP delivery, and 6-digit code verification.
  2. **Table Reservation (`BookingPage`)**: Date/time/guest count selection and real-time seating availability.
  3. **My Bookings (`MyBookingsPage`)**: List of confirmed table reservations for the authenticated user.
* **Backend API Endpoints (Strictly 5)**:
  1. `POST /api/auth/send-otp` - Sends OTP to user's phone via MiniMoth API.
  2. `POST /api/auth/verify-otp` - Verifies OTP code, provisions user, and issues auth token.
  3. `GET /api/tables` - Fetches restaurant tables, capacities, and locations.
  4. `POST /api/bookings` - Validates capacity/availability and creates table reservation.
  5. `GET /api/bookings/my` - Returns all reservations for the logged-in user.
* **Database Models (Strictly 3)**:
  1. `User` (`id`, `phone`, `name`, `created_at`)
  2. `Table` (`id`, `table_number`, `capacity`, `location`)
  3. `Booking` (`id`, `user_id`, `table_id`, `booking_date`, `booking_time`, `guests_count`, `status`, `created_at`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v22+ recommended)
- **npm**

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

#### MiniMoth API Configuration in `backend/.env`:
Get your free API key at [minimoth.dev](https://minimoth.dev).
```env
PORT=5000
MINIMOTH_API_KEY=mm_test_your_key_here
JWT_SECRET=workshop_super_secret_jwt_key_45min
```

> **Workshop Dev Mode**: If you don't have a MiniMoth key yet, set `MINIMOTH_API_KEY=mock`. In mock mode, the system prints the OTP to the server console and accepts `123456` as the valid code for immediate testing!

#### Start Backend Server:
```bash
npm start
# Server runs on http://localhost:5000
```

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔐 Authentication Flow with MiniMoth

1. User enters phone number in E.164 format (e.g., `+919876543210`).
2. Backend calls MiniMoth endpoint `POST https://api.minimoth.dev/v1/otp/send` with the `X-Api-Key` header.
3. MiniMoth delivers the 6-digit code via **WhatsApp** (with automatic SMS fallback).
4. User enters the 6-digit OTP code in the UI.
5. Backend calls MiniMoth endpoint `POST https://api.minimoth.dev/v1/otp/verify` to validate the passcode.
6. Upon verification, the user record is retrieved/created in SQLite and a JWT token is returned to the frontend.

---

## 📂 Project Structure

```
├── backend/
│   ├── .env.example        # Backend environment template
│   ├── .env                # Backend environment variables (Minimoth Key, JWT)
│   ├── database.js         # SQLite schema (Users, Tables, Bookings) + seeds
│   ├── package.json        # Express + dotenv + jsonwebtoken
│   └── server.js           # 5 API endpoints + auth middleware
├── frontend/
│   ├── .env.example        # Frontend environment template
│   ├── .env                # Frontend environment variables
│   ├── package.json        # React + Vite
│   ├── vite.config.js      # Proxy configuration to backend port 5000
│   ├── index.html          # Web page root with custom fonts
│   └── src/
│       ├── App.jsx         # 3-page state switcher & navigation
│       ├── index.css       # Warm bistro responsive styling
│       ├── api.js          # Fetch client for all 5 endpoints
│       └── pages/
│           ├── AuthPage.jsx       # Page 1: MiniMoth Phone OTP Login
│           ├── BookingPage.jsx    # Page 2: Table Selection & Reservation
│           └── MyBookingsPage.jsx # Page 3: User Reservations
└── README.md
```
