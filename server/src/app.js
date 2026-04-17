const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB } = require('./config/db');
const { passport, configureGoogleStrategy } = require('./config/passport');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./routes/auth.routes');
const packagesRoutes = require('./routes/packages.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');
const sitemapRoutes = require('./routes/sitemap.routes');

const app = express();

// ── Trailing slash normalization ─────────────────────────────────
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    return res.redirect(301, req.path.slice(0, -1) + (req._parsedUrl.search || ''));
  }
  next();
});

// ── Compression ──────────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

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

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim());

const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In dev, allow localhost / LAN IP / ngrok tunnels
      if (
        isDev &&
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      if (isDev && /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.io|ngrok\.app|trycloudflare\.com|loca\.lt)$/.test(origin)) {
        return callback(null, true);
      }
      console.warn('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
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

// ── Sitemap (before static files, public endpoint) ───────────────
app.use(sitemapRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Cache headers middleware ──────────────────────────────────────
const cacheMiddleware = (seconds) => (req, res, next) => {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
  next();
};

const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/packages', cacheMiddleware(300), packagesRoutes);
app.use('/api/orders', noCacheMiddleware, ordersRoutes);
app.use('/api/admin', noCacheMiddleware, adminRoutes);

// ── Static file serving (production) ─────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');

  // Hashed assets — cache aggressively
  app.use('/assets', express.static(path.join(clientBuild, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Other static files (index.html, manifest, etc.)
  app.use(express.static(clientBuild, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
} else {
  // ── 404 handler (dev only — Vite handles SPA in dev) ───────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
  });
}

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
