# Architecture Overview Diagram

```mermaid
graph TD
    subgraph Client["Client (Browser)"]
        SPA["React SPA<br/>Vite + Tailwind CSS"]
    end

    subgraph Server["Server (Node.js)"]
        Express["Express 5 API"]

        subgraph Middleware["Middleware Layer"]
            Helmet["Helmet<br/>(Security Headers)"]
            CORS["CORS"]
            RateLimit["Rate Limiter"]
            CookieParser["Cookie Parser"]
            Auth["JWT Verification"]
            RoleCheck["Role Check"]
        end

        subgraph Routes["Route Layer"]
            AuthRoutes["/api/auth"]
            PackageRoutes["/api/packages"]
            OrderRoutes["/api/orders"]
            AdminRoutes["/api/admin"]
        end

        subgraph BusinessLogic["Business Logic"]
            Controllers["Controllers"]
            Services["Services"]
            Validators["Validators"]
        end

        subgraph DataAccess["Data Access Layer"]
            UserModel["User Model"]
            PackageModel["Package Model"]
            OrderModel["Order Model"]
            TokenModel["Token Model"]
        end
    end

    subgraph Database["Database"]
        MSSQL["SQL Server<br/>6 Tables"]
    end

    subgraph External["External Services"]
        Google["Google OAuth 2.0"]
        SMTP["SMTP Server<br/>(Email)"]
        BAC["BAC Payment Gateway<br/>(Placeholder)"]
    end

    SPA -->|"HTTPS / JSON<br/>/api/*"| Express
    Express --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> CookieParser
    CookieParser --> Auth
    Auth --> RoleCheck
    RoleCheck --> Routes

    AuthRoutes --> Controllers
    PackageRoutes --> Controllers
    OrderRoutes --> Controllers
    AdminRoutes --> Controllers

    Controllers --> Services
    Controllers --> Validators
    Services --> DataAccess

    UserModel --> MSSQL
    PackageModel --> MSSQL
    OrderModel --> MSSQL
    TokenModel --> MSSQL

    Express -->|"OAuth 2.0"| Google
    Express -->|"SMTP/TLS"| SMTP
    Express -->|"HTTPS<br/>(Future)"| BAC

    style SPA fill:#61DAFB,stroke:#333,color:#000
    style MSSQL fill:#CC2927,stroke:#333,color:#fff
    style Google fill:#4285F4,stroke:#333,color:#fff
    style SMTP fill:#F5A623,stroke:#333,color:#000
    style BAC fill:#999,stroke:#333,color:#000
```

## Description

- **React SPA**: The frontend application runs entirely in the browser. It communicates with the backend exclusively through REST API calls over HTTPS.
- **Express 5 API**: The backend server processes all API requests through a middleware pipeline before reaching route handlers.
- **Middleware Pipeline**: Every request passes through Helmet (security headers), CORS (origin validation), rate limiting, and cookie parsing. Protected routes additionally pass through JWT verification and role checking.
- **Route Layer**: Four route groups handle auth, packages, orders, and admin operations.
- **Business Logic**: Controllers parse requests and orchestrate responses. Services encapsulate multi-step business operations. Validators ensure input correctness.
- **Data Access Layer**: Four model modules encapsulate all SQL queries using parameterized inputs via the `mssql` driver.
- **SQL Server**: The database stores all persistent data across 6 tables.
- **External Services**: Google OAuth for social login, SMTP for transactional emails, and BAC payment gateway (currently a placeholder for MVP).
