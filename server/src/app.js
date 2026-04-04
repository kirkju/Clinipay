const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const { passport, configureGoogleStrategy } = require('./config/passport');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./routes/auth.routes');
const packagesRoutes = require('./routes/packages.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ── Security ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────
// ── Validate required env vars ───────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[Server] FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// ── Rate limiting ─────────────────────────────────────────────────
app.use(generalLimiter);

// ── Passport ──────────────────────────────────────────────────────
app.use(passport.initialize());
configureGoogleStrategy();

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] CLINIPAY API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
}

start();

module.exports = app;
