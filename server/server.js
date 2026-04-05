// ============================================
// server/server.js - Main Entry Point
// ============================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db'); // ← Dedicated MongoDB connection file

const app  = express();
const PORT = process.env.PORT || 5000;

// ---- CORS: Allow browser, Postman, and file:// access ----
const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, direct file open)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow file:// origins (opening HTML files directly from disk)
    if (origin.startsWith('file://') || origin === 'null') return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ---- Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Serve Static Frontend Files ----
app.use(express.static(path.join(__dirname, '../client')));

// ---- API Routes ----
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/drivers',  require('./routes/drivers'));
app.use('/api/bookings', require('./routes/bookings'));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    status:   'OK',
    message:  'Let Me Drive API is running 🚗',
    database: 'Connected',
    time:     new Date().toISOString(),
  });
});

// ---- Catch-all: Serve index.html for SPA routing ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// ---- Connect DB then Start Server ----
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('🚗 ================================');
    console.log(`🚗  Let Me Drive server is running`);
    console.log('🚗 ================================');
    console.log(`🌐  Open:   http://localhost:${PORT}`);
    console.log(`📡  API:    http://localhost:${PORT}/api`);
    console.log(`❤️   Health: http://localhost:${PORT}/api/health`);
    console.log('');
  });
});
