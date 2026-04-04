# CLINIPAY Documentation Index

This directory contains the complete technical documentation for the CLINIPAY MVP -- a bilingual medical packages marketplace built with React, Express, and SQL Server.

## Documents

| Document | Description |
| -------- | ----------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Client-server architecture, design patterns, data flow, and rationale for every major technical decision (JWT, Tailwind, raw SQL, Vite). |
| [DATABASE.md](./DATABASE.md) | Complete schema for all 6 tables with column types, constraints, defaults, indexes, and notes on JSON-as-string fields. |
| [API.md](./API.md) | Full REST API reference for every endpoint across Auth, Packages, Orders, and Admin routes -- with request/response examples, auth requirements, and error codes. |
| [AUTH_FLOW.md](./AUTH_FLOW.md) | Detailed explanation of local login, Google OAuth, token refresh, and password recovery flows. Token storage strategy and auto-renewal logic. |
| [PURCHASE_FLOW.md](./PURCHASE_FLOW.md) | Step-by-step purchase flow from user and system perspectives, including error handling, edge cases, and BAC payment integration points. |
| [BAC_INTEGRATION.md](./BAC_INTEGRATION.md) | Exact files to modify, required environment variables, placeholder code, expected integration flow, step-by-step checklist, and security considerations for BAC payment gateway integration. |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Server requirements, VPS/Azure deployment steps, environment variable configuration, frontend build options, and SSL/HTTPS setup. |
| [SECURITY.md](./SECURITY.md) | All implemented security measures -- Helmet headers, rate limiting, input validation, SQL injection prevention, XSS/CSRF protection, password hashing, JWT policy, and production recommendations. |

## Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be rendered in GitHub, GitLab, VS Code (with Mermaid extensions), or any compatible Markdown viewer.

| Diagram | Description |
| ------- | ----------- |
| [diagrams/architecture-overview.md](./diagrams/architecture-overview.md) | High-level system architecture showing React SPA, Express API, SQL Server, and external services. |
| [diagrams/er-diagram.md](./diagrams/er-diagram.md) | Entity-Relationship diagram for all 6 database tables with relationships and cardinality. |
| [diagrams/purchase-flow.md](./diagrams/purchase-flow.md) | Complete purchase flowchart from browsing to order confirmation. |
| [diagrams/auth-flow.md](./diagrams/auth-flow.md) | Sequence diagrams for local login, Google OAuth, token refresh, and password recovery. |
| [diagrams/order-states.md](./diagrams/order-states.md) | State machine diagram showing all order statuses and valid transitions. |
| [diagrams/component-tree.md](./diagrams/component-tree.md) | React component hierarchy from App down through providers, layouts, and pages. |
| [diagrams/api-sequence.md](./diagrams/api-sequence.md) | Sequence diagrams for key API operations: create order, admin status change, admin list orders. |
| [diagrams/deployment-diagram.md](./diagrams/deployment-diagram.md) | Infrastructure diagram showing Internet, CDN, server, database, and external service connections. |
