# Security

This document catalogs all security measures implemented in CLINIPAY and provides recommendations for hardening the application in production.

---

## Implemented Security Measures

### 1. Helmet.js HTTP Headers

The Express server uses [Helmet](https://helmetjs.github.io/) to set secure HTTP response headers automatically.

| Header | Effect |
| ------ | ------ |
| `Content-Security-Policy` | Restricts sources of scripts, styles, images, and other resources. |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing. |
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking by disallowing iframe embedding from other origins. |
| `X-XSS-Protection: 0` | Disables the legacy XSS auditor (modern CSP is preferred). |
| `Strict-Transport-Security` | Forces HTTPS for future requests (HSTS). |
| `X-DNS-Prefetch-Control: off` | Disables DNS prefetching. |
| `X-Permitted-Cross-Domain-Policies: none` | Prevents Flash/Acrobat cross-domain requests. |
| `Referrer-Policy: no-referrer` | Prevents leaking the URL in the Referer header. |

**File**: Helmet is applied globally in `src/app.js`.

---

### 2. Rate Limiting

Rate limiting is implemented with [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit) to prevent brute-force attacks and abuse.

| Limiter | Target Endpoint | Max Attempts | Time Window | Message |
| ------- | --------------- | ------------ | ----------- | ------- |
| `loginLimiter` | `POST /api/auth/login` | 5 | 15 minutes | "Too many login attempts. Please try again after 15 minutes." |
| `registerLimiter` | `POST /api/auth/register` | 3 | 1 hour | "Too many registration attempts. Please try again after 1 hour." |
| `forgotPasswordLimiter` | `POST /api/auth/forgot-password` | 3 | 1 hour | "Too many password reset requests. Please try again after 1 hour." |
| `generalLimiter` | All endpoints | 100 | 15 minutes | "Too many requests. Please try again later." |

Configuration:
- Standard rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) are sent.
- Legacy headers (`X-RateLimit-*`) are disabled.
- The general limiter's window and max are configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`.

**File**: `src/middleware/rateLimiter.js`

---

### 3. Input Validation

All user input is validated on the server side using [`express-validator`](https://express-validator.github.io/). Validation occurs before the controller logic runs.

**Validated fields include:**
- Email format.
- Password strength: minimum 8 characters, at least 1 uppercase letter, at least 1 number (regex: `/^(?=.*[A-Z])(?=.*\d).{8,}$/`).
- Required fields: first name, last name for registration.
- Numeric IDs for URL parameters.
- Status values against the allowed enum.

**File**: `src/validators/` (validation schemas) and `src/config/constants.js` (password regex).

---

### 4. SQL Injection Prevention

All database queries use **parameterized inputs** via the `mssql` driver's `.input()` method. User-supplied values are NEVER concatenated into query strings.

**Example (from `user.model.js`):**

```javascript
const result = await pool.request()
  .input('email', sql.NVarChar(255), email)  // Typed, parameterized
  .query('SELECT * FROM users WHERE email = @email');
```

Every query in every model follows this pattern. The `mssql` driver handles escaping and quoting automatically based on the declared SQL type.

**Files**: All files in `src/models/`.

---

### 5. XSS Protection

**Server side:**
- Helmet's `Content-Security-Policy` header restricts executable script sources.
- The API returns JSON, not HTML, so reflected XSS is not applicable to API responses.

**Client side:**
- React automatically escapes all interpolated values in JSX, preventing reflected and stored XSS.
- The [`DOMPurify`](https://github.com/cure53/DOMPurify) library is included as a dependency for sanitizing any user-generated HTML content before rendering (if needed).
- The `escapeValue: false` setting in i18next is safe because React handles escaping at the JSX level.

---

### 6. CSRF Protection

**Primary defense: httpOnly cookie + Bearer token pattern.**

The refresh token is stored in an `httpOnly` cookie, but API requests require the access token in the `Authorization` header. An attacker performing a cross-site request can include the cookie but cannot include the access token (stored in JavaScript memory and inaccessible from other origins). This effectively prevents CSRF for all authenticated endpoints.

**Additional measures:**
- `SameSite=Strict` on the refresh token cookie prevents the browser from sending it in cross-site requests.
- CORS is configured to only allow requests from `CLIENT_URL`.

---

### 7. Password Hashing

Passwords are hashed with [bcrypt](https://www.npmjs.com/package/bcryptjs) using **12 salt rounds**.

- 12 rounds produces approximately 250ms of hashing time per password, providing strong resistance against brute-force attacks.
- The `bcryptjs` library is a pure-JavaScript implementation (no native compilation required).
- Password hashes are stored in the `password_hash` column (`NVARCHAR(255)`).
- Google OAuth users have `password_hash = NULL` (no local password).

---

### 8. JWT Policy

| Property | Value |
| -------- | ----- |
| Algorithm | HS256 |
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Access token storage | In-memory JavaScript variable |
| Refresh token storage (client) | httpOnly, Secure, SameSite=Strict cookie |
| Refresh token storage (server) | Hashed in `refresh_tokens` table |
| Token revocation | On logout: single token revoked. On password change/reset: ALL user tokens revoked. |
| Payload | `{ id, email, role, iat, exp }` -- minimal, no sensitive data. |

**Token verification** is performed by the `verifyToken` middleware, which:
1. Extracts the Bearer token from the Authorization header.
2. Verifies the signature and expiration using `jsonwebtoken.verify()`.
3. Attaches the decoded payload to `req.user`.
4. Returns 401 with `code: "TOKEN_EXPIRED"` for expired tokens (so the frontend can trigger a refresh).

**File**: `src/middleware/auth.js`

---

### 9. CORS Configuration

CORS is configured to only accept requests from the frontend origin:

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,  // Allow cookies
}));
```

This prevents other websites from making authenticated API requests on behalf of the user.

---

### 10. Error Handling

The global error handler (`src/middleware/errorHandler.js`) ensures:

- **Full error details are logged server-side** (message, stack trace, URL, method, IP, timestamp).
- **In production**, the client receives a generic "An internal server error occurred." message for 500 errors. Stack traces are NEVER leaked.
- **In development**, stack traces are included in the response for debugging convenience.

---

### 11. Cookie Security

The refresh token cookie is configured with:

| Flag | Value | Purpose |
| ---- | ----- | ------- |
| `httpOnly` | `true` | Inaccessible to JavaScript (XSS protection). |
| `secure` | `true` (production) | Only sent over HTTPS. |
| `sameSite` | `Strict` | Not sent in cross-site requests (CSRF protection). |
| `path` | `/api/auth` | Only sent to auth endpoints (minimizes exposure). |
| `maxAge` | 7 days | Matches refresh token lifetime. |

---

## User Enumeration Prevention

- **Login**: Returns "Invalid email or password" for both wrong email and wrong password.
- **Forgot password**: Always returns "If the email is registered, a reset link has been sent." regardless of whether the email exists.
- **Registration**: Returns 409 if the email is already taken (this is a conscious trade-off; the user needs to know the email is taken to try a different one).

---

## Production Recommendations

### Web Application Firewall (WAF)

Deploy a WAF (Cloudflare, AWS WAF, Azure WAF) in front of the application to:
- Block known attack patterns (SQL injection, XSS, path traversal).
- Provide DDoS protection.
- Enforce geographic restrictions if the service is region-specific (Honduras).

### Monitoring & Alerting

- Set up application monitoring with a service like Datadog, New Relic, or Azure Application Insights.
- Alert on:
  - Elevated 500 error rates.
  - Elevated rate-limit (429) responses (possible attack).
  - Abnormal login failure rates.
  - Database connection failures.

### Logging

- Ship logs to a centralized logging service (ELK stack, Azure Log Analytics, Datadog Logs).
- Log all authentication events (login success/failure, registration, password reset, token refresh).
- Log all admin actions (status changes, package creation/modification).
- Never log passwords, tokens, or sensitive PII in plaintext.

### Database Security

- Use a dedicated database user with the minimum required permissions (no `sa`).
- Enable SQL Server auditing.
- Encrypt data at rest (SQL Server Transparent Data Encryption).
- Enable TLS for database connections (`DB_ENCRYPT=true`).
- Schedule automated backups with retention policies.

### HTTPS Everywhere

- Enforce HTTPS with HSTS headers (Helmet does this).
- Redirect all HTTP traffic to HTTPS at the Nginx or load balancer level.
- Use TLS 1.2+ only; disable older protocols.

### Dependency Management

- Run `npm audit` regularly to check for known vulnerabilities.
- Use Dependabot or Renovate to automatically update dependencies.
- Pin dependency versions in `package-lock.json`.

### Secrets Management

- Never commit `.env` files to version control.
- Use environment variables or a secrets manager (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).
- Rotate JWT secrets and database passwords periodically.

### Backup & Disaster Recovery

- Automated daily database backups with at least 30-day retention.
- Test backup restoration regularly.
- Store backups in a separate geographic region.

### Content Security Policy Tuning

- Review and tighten the CSP header for production.
- Allow only your domain and trusted CDNs (Google Fonts, etc.).
- Use `report-uri` or `report-to` directives to monitor CSP violations.

---

## Security Headers Verification

After deployment, verify security headers using:

- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- `curl -I https://yourdomain.com`

---

## References

- [Auth Flow](./AUTH_FLOW.md) -- Token strategy and authentication details.
- [Deployment Guide](./DEPLOYMENT.md) -- SSL and production configuration.
- [API Reference](./API.md) -- Rate limiting and error response details.
