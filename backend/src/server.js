const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const challengeRoutes = require('./routes/challenge.routes');
const adminRoutes = require('./routes/admin.routes');
const aiRoutes = require('./routes/ai.routes');
const universityRoutes = require('./routes/university.routes');
const matchingRoutes = require('./routes/matching.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const locationRoutes = require('./routes/location.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SICP Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Challenge routes
app.use('/api/challenges', challengeRoutes);

// Admin / Government review routes
app.use('/api/admin', adminRoutes);

// AI Problem Intelligence routes
app.use('/api/ai', aiRoutes);

// Phase 5: University directory routes
app.use('/api/universities', universityRoutes);

// Phase 5: University matching routes
app.use('/api/matching', matchingRoutes);

// Phase 5: Assignment routes (both plural and singular for client compatibility)
app.use('/api/assignments', assignmentRoutes);
app.use('/api/assignment', assignmentRoutes);

// Location master data routes
app.use('/api/locations', locationRoutes);

// Also mount /api/v1 prefix for compatibility
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/challenges', challengeRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/ai', aiRoutes);
v1Router.use('/universities', universityRoutes);
v1Router.use('/matching', matchingRoutes);
v1Router.use('/assignments', assignmentRoutes);
v1Router.use('/assignment', assignmentRoutes);
v1Router.use('/locations', locationRoutes);
app.use('/api/v1', v1Router);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   Societal Innovation Collaboration Portal       ║
  ║   Backend API Server                             ║
  ║   Running on: http://localhost:${PORT}              ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
