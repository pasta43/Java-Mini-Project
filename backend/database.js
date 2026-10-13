const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'restaurant.db');
const db = new DatabaseSync(dbPath);

// Initialize database schema (3 entities: users, restaurant_tables, bookings)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    location TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    guests_count INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (table_id) REFERENCES restaurant_tables (id)
  );
`);

// Seed default restaurant tables if none exist
const checkTables = db.prepare('SELECT COUNT(*) as count FROM restaurant_tables').get();
if (checkTables.count === 0) {
  const insertTable = db.prepare(
    'INSERT INTO restaurant_tables (table_number, capacity, location) VALUES (?, ?, ?)'
  );

  const initialTables = [
    ['Table #1', 2, 'Window View'],
    ['Table #2', 4, 'Main Dining Hall'],
    ['Table #3', 4, 'Garden Patio'],
    ['Table #4', 6, 'Family Booth'],
    ['Table #5', 8, 'Chef Private Table']
  ];

  for (const [tableNumber, capacity, location] of initialTables) {
    insertTable.run(tableNumber, capacity, location);
  }
  console.log('[Database] Seeded 5 default restaurant tables.');
}

module.exports = db;

