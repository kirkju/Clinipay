# CLINIPAY - Medical Packages Marketplace

CLINIPAY is a bilingual (Spanish/English) web platform for purchasing medical service packages online. Built for the Honduran healthcare market, it allows patients to browse, compare, and pay for curated medical packages through a modern, secure interface.

## Tech Stack

| Layer       | Technology                                              |
| ----------- | ------------------------------------------------------- |
| Frontend    | React 19, Vite 8, Tailwind CSS 4, React Router 7       |
| Backend     | Node.js, Express 5                                      |
| Database    | Microsoft SQL Server (via `mssql` driver)               |
| Auth        | JWT (access + refresh tokens), Google OAuth 2.0         |
| Payments    | BAC payment gateway (placeholder for MVP)               |
| Email       | Nodemailer (SMTP)                                       |
| i18n        | react-i18next with browser language detection           |
| Icons       | Lucide React                                            |
| Validation  | express-validator (server), client-side validation       |

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **SQL Server** 2019+ (local, Docker, or Azure SQL)
- **Google Cloud Console** project with OAuth 2.0 credentials (optional for development)
- **SMTP server** for transactional emails (e.g., Mailtrap for dev, SendGrid/SES for production)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd Clinipay

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Configuration

Create a `.env` file in the `server/` directory:

```env
# ── Server ──────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database ────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_NAME=clinipay
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# ── JWT ─────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ── Google OAuth ────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ── SMTP ────────────────────────────────────────────────
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM=CLINIPAY <noreply@clinipay.com>

# ── Rate Limiting (optional overrides) ──────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ── Frontend URL (for CORS, emails) ────────────────────
CLIENT_URL=http://localhost:5173
```

## Database Setup

1. Create a database named `clinipay` in your SQL Server instance.
2. Run migrations to create all tables:

```bash
cd server
npm run migrate
```

3. Seed the database with an admin user and sample packages:

```bash
npm run seed
```

Default admin credentials after seeding:
- Email: `admin@clinipay.com`
- Password: `CliniPay2025!`

## Development

Start both the backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend (port 5000)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173, proxies /api to backend)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

```bash
# Build the frontend
cd client
npm run build

# The dist/ folder can be served by Express or a reverse proxy (Nginx)
# Start the backend in production mode
cd ../server
NODE_ENV=production npm start
```

## Project Structure

```
Clinipay/
├── client/                      # React SPA (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── index.css            # Tailwind imports + theme tokens
│       ├── main.jsx             # App entry point
│       ├── components/
│       │   ├── guards/          # Route protection (AuthGuard, AdminGuard)
│       │   ├── layout/          # Navbar, Footer, AdminLayout
│       │   └── ui/              # Button, Input, Spinner
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state + token management
│       ├── hooks/               # Custom React hooks
│       ├── i18n/
│       │   ├── index.js         # i18next configuration
│       │   ├── es.json          # Spanish translations
│       │   └── en.json          # English translations
│       ├── pages/
│       │   ├── public/          # Home, Catalog, PackageDetail
│       │   ├── user/            # Login, Register, MyOrders, OrderDetail, Checkout
│       │   └── admin/           # Dashboard, Orders, Packages, Users
│       ├── services/
│       │   ├── api.js           # Axios instance + interceptors
│       │   ├── auth.service.js
│       │   ├── packages.service.js
│       │   ├── orders.service.js
│       │   └── admin.service.js
│       └── utils/
│           └── constants.js     # Status maps, formatters
│
├── server/                      # Express API
│   ├── package.json
│   ├── migrations/
│   │   ├── run.js               # Migration runner
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_packages.sql
│   │   ├── 003_create_orders.sql
│   │   ├── 004_create_order_status_history.sql
│   │   ├── 005_create_refresh_tokens.sql
│   │   └── 006_create_password_reset_tokens.sql
│   ├── seeds/
│   │   └── run.js               # Admin user + sample packages
│   └── src/
│       ├── app.js               # Express app bootstrap
│       ├── config/
│       │   ├── db.js            # SQL Server connection pool
│       │   ├── email.js         # Nodemailer transporter
│       │   ├── constants.js     # Order statuses, roles, regex
│       │   └── passport.js      # Google OAuth strategy
│       ├── controllers/         # Route handlers
│       ├── middleware/
│       │   ├── auth.js          # JWT verification
│       │   ├── roleCheck.js     # Role-based access control
│       │   ├── rateLimiter.js   # Rate limiters
│       │   └── errorHandler.js  # Global error handler
│       ├── models/
│       │   ├── user.model.js
│       │   ├── package.model.js
│       │   ├── order.model.js
│       │   └── token.model.js
│       ├── routes/              # Express routers
│       ├── services/            # Business logic
│       ├── utils/               # Helpers
│       └── validators/          # express-validator schemas
│
└── docs/                        # Project documentation
    ├── README.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── AUTH_FLOW.md
    ├── PURCHASE_FLOW.md
    ├── BAC_INTEGRATION.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    └── diagrams/
        ├── architecture-overview.md
        ├── er-diagram.md
        ├── purchase-flow.md
        ├── auth-flow.md
        ├── order-states.md
        ├── component-tree.md
        ├── api-sequence.md
        └── deployment-diagram.md
```

## Documentation

Full project documentation is available in the [`docs/`](./docs/README.md) directory:

- [Architecture](./docs/ARCHITECTURE.md) -- System design and technical decisions
- [Database Schema](./docs/DATABASE.md) -- All tables, columns, and relationships
- [REST API Reference](./docs/API.md) -- Every endpoint with examples
- [Authentication Flows](./docs/AUTH_FLOW.md) -- JWT, OAuth, password recovery
- [Purchase Flow](./docs/PURCHASE_FLOW.md) -- End-to-end order lifecycle
- [BAC Payment Integration](./docs/BAC_INTEGRATION.md) -- Payment gateway integration guide
- [Deployment Guide](./docs/DEPLOYMENT.md) -- Server setup and production configuration
- [Security](./docs/SECURITY.md) -- Security measures and recommendations
- [Diagrams](./docs/diagrams/) -- Mermaid architecture, ER, flow, and sequence diagrams

## License

ISC
