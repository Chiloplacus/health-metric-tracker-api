const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing from .env");
} else {
  console.log("JWT_SECRET loaded from .env");
}


const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader); // 👈 Add this

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token');
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}
  
// Dummy user 
const DUMMY_USER = {
    id: 1,
    email: 'user@example.com',
    password: 'password123'  // JUST for development so far
  };

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
    const token = jwt.sign({ userId: DUMMY_USER.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

  // POST /api/metrics - Save metric to PostgreSQL
app.post('/api/metrics', authenticateToken, async (req, res) => {
  const { systolic, diastolic } = req.body;

  if (!systolic || !diastolic) {
    return res.status(400).json({ message: 'Systolic and diastolic values are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO metrics (user_id, systolic, diastolic) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, systolic, diastolic]
    );

    res.status(201).json({ message: 'Metric saved', metric: result.rows[0] });
  } catch (error) {
    console.error('Error inserting metric:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/metrics - Retrieve metrics for user
app.get('/api/metrics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT systolic, diastolic, created_at FROM metrics WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/hello', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

