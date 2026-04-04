# Architecture

## Overview

CLINIPAY follows a classic **client-server** architecture with a clear separation between the frontend single-page application (SPA) and the backend REST API. The frontend is a React application bundled by Vite; the backend is a Node.js/Express server that communicates with a SQL Server database. External integrations include Google OAuth for social login, SMTP for transactional emails, and the BAC payment gateway (currently a placeholder).

See also: [Architecture Overview Diagram](./diagrams/architecture-overview.md)

## Architecture Diagram (Summary)

```
┌──────────────┐        HTTPS / JSON        ┌───────────────────┐        T-SQL        ┌──────────────┐
│  React SPA   │  ◄───────────────────────►  │  Express API      │  ◄───────────────►  │  SQL Server  │
│  (Vite)      │        /api/*               │  (Node.js)        │                     │              │
└──────────────┘                             └───────┬───────────┘                     └──────────────┘
                                                     │
                                          ┌──────────┼──────────┐
                                          │          │          │
                                     Google OAuth   SMTP    BAC Gateway
                                                            (placeholder)
```

## Design Patterns

### Backend -- MVC-inspired Layered Architecture

The server code is organized into clearly separated layers:

| Layer | Directory | Responsibility |
| ----- | --------- | -------------- |
| **Routes** | `src/routes/` | HTTP verb + path declarations; delegates to controllers. |
| **Controllers** | `src/controllers/` | Request parsing, calling services/models, formatting responses. |
| **Models** | `src/models/` | Data access layer. Each model encapsulates parameterized SQL queries for one table (or closely related tables). |
| **Middleware** | `src/middleware/` | Cross-cutting concerns: JWT verification, role-based access, rate limiting, error handling. |
| **Config** | `src/config/` | Database pool, email transporter, Passport strategies, application constants. |
| **Services** | `src/services/` | Business logic that spans multiple models (e.g., order creation + status history + email notification). |
| **Validators** | `src/validators/` | express-validator chains for request body/param validation. |

### Frontend -- Functional Components + Context API

The client follows idiomatic modern React patterns:

| Concept | Implementation |
| ------- | -------------- |
| **State management** | React Context (`AuthContext`) for global auth state; local `useState`/`useReducer` within pages. |
| **Routing** | React Router v7 with layout routes, nested routes, and route guards. |
| **API communication** | Centralized Axios instance (`services/api.js`) with request/response interceptors for JWT injection and silent token refresh. |
| **Internationalization** | react-i18next with browser language detection and `localStorage` persistence. Two translation files (ES/EN). |
| **UI components** | Small, reusable components (`Button`, `Input`, `Spinner`) with Tailwind utility classes. |
| **Guards** | `AuthGuard` and `AdminGuard` components wrap protected routes, redirecting unauthenticated or unauthorized users. |

## Data Flow

### Typical Authenticated Request

1. User interacts with the React UI.
2. A service function (e.g., `orders.service.js`) calls the Axios instance.
3. The Axios request interceptor attaches the in-memory access token as `Authorization: Bearer <token>`.
4. The request hits Express, passing through `helmet`, `cors`, `generalLimiter`, and `cookie-parser` middleware.
5. Route-specific middleware (`verifyToken`, `requireRole`) validates auth.
6. The controller calls the appropriate model method.
7. The model executes a parameterized SQL query against the connection pool.
8. The response travels back: model -> controller -> Express -> Axios -> React state -> UI re-render.

### Token Refresh (Silent)

1. If a 401 response is received and the request has not already been retried, the Axios response interceptor fires.
2. It sends `POST /api/auth/refresh` with the httpOnly refresh-token cookie.
3. On success, the new access token replaces the in-memory token and the original request is replayed.
4. If refresh fails, the user is redirected to `/login`.
5. Concurrent requests that fail during a refresh are queued and replayed once the new token is available.

## Technical Decisions

### Why JWT instead of server sessions?

- **Stateless API**: No session store is needed on the server; the access token is self-contained.
- **Scalability**: Horizontal scaling is trivial because no sticky sessions or shared session store is required.
- **Mobile-ready**: The same API can serve a future mobile client without session cookie complexities.
- **Short-lived access tokens** (15 minutes) paired with **httpOnly refresh tokens** (7 days) give a good balance of security and UX.

### Why Tailwind CSS instead of a component library?

- **Bundle size**: Only the CSS classes actually used ship in the production build (automatic tree-shaking via Vite plugin).
- **Design control**: Full control over the design system without fighting a library's opinionated styles. CLINIPAY defines its own brand tokens (`--color-primary`, `--color-primary-dark`, etc.) in `index.css`.
- **Speed**: Utility-first CSS eliminates context-switching between component files and stylesheets, accelerating UI development.
- **Consistency**: The design-token-based approach ensures a cohesive look across every component.

### Why `mssql` direct queries instead of an ORM?

- **Performance**: No query generation overhead. Queries are hand-tuned SQL with parameterized inputs.
- **Transparency**: Every query is visible in the model file; there are no hidden joins or N+1 problems.
- **SQL Server features**: Direct access to T-SQL features like `OUTPUT INSERTED.*`, `OFFSET ... FETCH NEXT`, window functions, and CTEs without ORM abstraction leaks.
- **Simplicity for MVP**: Six tables with straightforward relationships do not justify the setup cost of Sequelize, TypeORM, or Prisma.
- **Security**: All user-supplied values go through `sql.NVarChar`, `sql.Int`, etc. typed parameters, preventing SQL injection by design.

### Why Vite instead of Create React App or Webpack?

- **Speed**: Vite uses native ES modules in development, so hot module replacement (HMR) is near-instantaneous regardless of project size.
- **Modern defaults**: Out-of-the-box support for JSX, TypeScript, CSS modules, and environment variables.
- **Tailwind integration**: The `@tailwindcss/vite` plugin integrates seamlessly without PostCSS configuration headaches.
- **Proxy**: The `vite.config.js` proxy setting eliminates CORS issues during development by forwarding `/api` requests to the Express server.
- **Small config**: The entire Vite configuration is 16 lines.

### Why Express 5?

- **Async error handling**: Express 5 natively catches promise rejections in route handlers, eliminating the need for `express-async-errors` or manual try/catch wrappers.
- **Mature ecosystem**: Helmet, cors, cookie-parser, express-rate-limit, express-validator, and Passport all work with Express 5.
- **Familiarity**: The most widely used Node.js framework, making onboarding new developers fast.

## Module Dependency Map

```
app.js
├── config/db.js            (SQL Server pool)
├── config/email.js          (Nodemailer)
├── config/passport.js       (Google OAuth)
├── config/constants.js      (Statuses, roles, regex)
├── middleware/auth.js        (verifyToken)
├── middleware/roleCheck.js   (requireRole)
├── middleware/rateLimiter.js (login, register, forgot, general)
├── middleware/errorHandler.js
├── routes/
│   ├── auth.routes.js       → controllers/ → models/user, token
│   ├── package.routes.js    → controllers/ → models/package
│   ├── order.routes.js      → controllers/ → models/order, package
│   └── admin.routes.js      → controllers/ → models/order, package, user
└── validators/
```

## References

- [Architecture Overview Diagram](./diagrams/architecture-overview.md)
- [Component Tree Diagram](./diagrams/component-tree.md)
- [Deployment Diagram](./diagrams/deployment-diagram.md)
