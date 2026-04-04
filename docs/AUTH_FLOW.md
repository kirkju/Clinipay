# Authentication Flows

CLINIPAY supports two authentication methods: **local** (email + password) and **Google OAuth 2.0**. Both methods produce the same pair of tokens (access + refresh) and result in the same authenticated session experience.

See also: [Auth Flow Sequence Diagrams](./diagrams/auth-flow.md)

---

## Token Strategy

### Access Token

| Property | Value |
| -------- | ----- |
| Format | JWT (HS256) |
| Storage | JavaScript variable in memory (never localStorage or sessionStorage) |
| Lifetime | 15 minutes (configurable via `JWT_EXPIRES_IN`) |
| Payload | `{ id, email, role, iat, exp }` |
| Sent as | `Authorization: Bearer <token>` header |

### Refresh Token

| Property | Value |
| -------- | ----- |
| Format | UUID v4 |
| Storage (client) | httpOnly, Secure, SameSite=Strict cookie named `refreshToken` |
| Storage (server) | Hashed in the `refresh_tokens` table |
| Lifetime | 7 days (configurable via `REFRESH_TOKEN_EXPIRES_IN`) |
| Purpose | Obtain a new access token without re-authenticating |

### Why In-Memory Access Tokens?

Storing the access token in a JavaScript variable (inside `api.js`) instead of `localStorage` prevents XSS attacks from reading the token. If an attacker injects malicious JavaScript, they cannot extract the token from the DOM or storage -- it only exists in the module closure. The trade-off is that the token is lost on page refresh, but the refresh token cookie restores the session automatically.

### Why httpOnly Cookies for Refresh Tokens?

The `httpOnly` flag prevents JavaScript from accessing the cookie, making it immune to XSS theft. The `Secure` flag ensures the cookie is only sent over HTTPS. `SameSite=Strict` prevents the cookie from being sent in cross-site requests, mitigating CSRF.

---

## Flow 1: Local Registration

1. User fills out the registration form (first name, last name, email, password, optional phone).
2. Frontend validates the form locally (required fields, password strength, password confirmation match).
3. Frontend calls `POST /api/auth/register` with the user data.
4. Backend validates input with express-validator.
5. Backend checks if the email is already registered.
6. Backend hashes the password with bcrypt (12 salt rounds).
7. Backend inserts the new user into the `users` table.
8. Backend generates a JWT access token (15 min) and a UUID refresh token.
9. Backend hashes the refresh token and stores it in `refresh_tokens`.
10. Backend sets the refresh token as an httpOnly cookie.
11. Backend returns the access token and user profile in the response body.
12. Frontend stores the access token in memory via `setAccessToken()`.
13. Frontend updates the `AuthContext` with the user object.
14. Frontend redirects to the home page.

---

## Flow 2: Local Login

1. User enters email and password on the login form.
2. Frontend calls `POST /api/auth/login`.
3. Rate limiter checks: max 5 attempts per 15 minutes per IP.
4. Backend validates input.
5. Backend looks up the user by email.
6. Backend compares the password against the stored hash using `bcrypt.compare()`.
7. If valid, backend generates access + refresh tokens (same as registration).
8. Backend revokes any existing refresh tokens for the user (optional; depends on config).
9. Backend sets the refresh token cookie and returns the access token + user profile.
10. Frontend stores the access token and updates `AuthContext`.
11. Frontend redirects to the home page (or the page the user was trying to access).

**Failed Login:**
- If the email does not exist or the password is wrong, the backend returns 401 with a generic message ("Invalid email or password") to avoid revealing which part was incorrect.
- After 5 failed attempts within 15 minutes, subsequent requests receive 429.

---

## Flow 3: Google OAuth

1. User clicks "Continue with Google" button.
2. Frontend navigates the browser to `GET /api/auth/google`.
3. Express invokes the Passport Google OAuth strategy, which redirects to Google's consent screen.
4. User signs in with their Google account and grants permission.
5. Google redirects to `GET /api/auth/google/callback` with an authorization code.
6. Passport exchanges the code for the user's Google profile (email, name, Google ID).
7. Backend checks if a user with this `google_id` exists in the database:
   - **Yes**: Use the existing user.
   - **No**: Check if a user with this email exists (local registration):
     - **Yes**: Link the Google account by setting `google_id` and `auth_provider = 'google'`.
     - **No**: Create a new user with `auth_provider = 'google'` and `password_hash = NULL`.
8. Backend generates access + refresh tokens.
9. Backend sets the refresh token cookie.
10. Backend redirects the browser to `CLIENT_URL/?token=<accessToken>`.
11. Frontend extracts the token from the URL query string.
12. Frontend stores the access token in memory and fetches the user profile via `GET /api/auth/me`.
13. Frontend removes the token from the URL and updates `AuthContext`.

**Account Linking:** If a user registered with email/password first and later signs in with Google using the same email, the accounts are automatically linked. The user can then sign in with either method.

---

## Flow 4: Token Refresh (Auto-Renewal)

This flow is handled transparently by the Axios response interceptor in `services/api.js`.

1. A protected API request returns 401 (access token expired).
2. The interceptor catches the 401 and checks `originalRequest._retry` to prevent infinite loops.
3. If no refresh is already in progress:
   - Set `isRefreshing = true`.
   - Call `POST /api/auth/refresh` (sends the httpOnly cookie automatically).
   - Backend validates the refresh token: not expired, not revoked, hash matches.
   - Backend issues a new access token.
   - Frontend stores the new access token in memory.
   - Frontend replays the original failed request with the new token.
   - Set `isRefreshing = false`.
4. If a refresh IS already in progress (concurrent requests):
   - The request is added to a `failedQueue`.
   - Once the refresh completes, all queued requests are replayed with the new token.
5. If the refresh itself fails (expired or revoked refresh token):
   - All queued requests are rejected.
   - Access token is cleared.
   - User is redirected to `/login`.

### Session Restoration on Page Load

When the React app mounts, `AuthContext` calls `restoreSession()`:

1. Call `POST /api/auth/refresh` to get a new access token (using the cookie).
2. If successful, call `GET /api/auth/me` to fetch the user profile.
3. Set the user in context and mark `loading = false`.
4. If either call fails, set user to `null` and clear the access token.

This ensures that refreshing the page does not log the user out, even though the access token (stored in memory) was lost.

---

## Flow 5: Password Recovery

### Step A: Request Reset

1. User clicks "Forgot Password?" on the login page.
2. User enters their email address.
3. Frontend calls `POST /api/auth/forgot-password`.
4. Rate limiter checks: max 3 attempts per hour per IP.
5. Backend looks up the user by email.
6. If the user exists:
   - Generate a UUID v4 token.
   - Hash the token and store it in `password_reset_tokens` with a 1-hour expiration.
   - Send an email containing a link: `CLIENT_URL/reset-password/<token>`.
7. Backend returns a generic success message regardless of whether the email exists (prevents user enumeration).

### Step B: Reset Password

1. User clicks the link in the email, which opens the React app at `/reset-password/:token`.
2. User enters a new password (and confirmation).
3. Frontend calls `POST /api/auth/reset-password` with the token and new password.
4. Backend hashes the token and looks it up in `password_reset_tokens`.
5. Backend validates: token exists, is not expired, is not already used.
6. Backend hashes the new password with bcrypt (12 salt rounds).
7. Backend updates the user's `password_hash`.
8. Backend marks the reset token as used (`is_used = 1`).
9. Backend revokes all existing refresh tokens for the user (forces re-login on all devices).
10. Frontend shows a success message and redirects to the login page.

---

## Logout

1. Frontend calls `POST /api/auth/logout`.
2. Backend reads the refresh token from the cookie.
3. Backend revokes the token in the database (`is_revoked = 1`).
4. Backend clears the `refreshToken` cookie.
5. Frontend clears the in-memory access token.
6. Frontend sets user to `null` in `AuthContext`.
7. User is redirected to the login page.

---

## Security Summary

| Measure | Implementation |
| ------- | -------------- |
| Password hashing | bcrypt with 12 salt rounds |
| Access token exposure | In memory only; never persisted to storage |
| Refresh token exposure | httpOnly, Secure, SameSite=Strict cookie |
| Token rotation | New refresh token on each refresh (optional) |
| Brute force protection | Rate limiting on login (5/15min), register (3/hr), forgot-password (3/hr) |
| User enumeration prevention | Generic responses for login failure and forgot-password |
| Session invalidation | Revoke all refresh tokens on password change/reset |

---

## References

- [Auth Flow Sequence Diagrams](./diagrams/auth-flow.md)
- [Security](./SECURITY.md)
- [API Reference -- Auth Endpoints](./API.md#auth-endpoints)
