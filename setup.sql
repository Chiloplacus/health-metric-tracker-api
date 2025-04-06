-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Add one dummy user (matches your backend login)
INSERT INTO users (email, password)
VALUES ('user@example.com', 'password123');

-- Metrics table
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
