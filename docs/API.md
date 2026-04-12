# REST API Reference

Base URL: `/api`

All endpoints return JSON with a consistent envelope:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

On error:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Table of Contents

- [Auth Endpoints](#auth-endpoints)
- [Package Endpoints](#package-endpoints)
- [Order Endpoints](#order-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Auth Endpoints

Base path: `/api/auth`

### POST /api/auth/register

Create a new client account.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | 3 requests / hour / IP |

**Request Body:**

```json
{
  "email": "maria@example.com",
  "password": "SecurePass1",
  "firstName": "Maria",
  "lastName": "Rodriguez",
  "phone": "+504 0000-1234",
  "preferredLanguage": "es"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Account created successfully.",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 5,
    "email": "maria@example.com",
    "first_name": "Maria",
    "last_name": "Rodriguez",
    "role": "client",
    "preferred_language": "es"
  }
}
```

A refresh token is set as an `httpOnly` cookie named `refreshToken`.

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Validation errors (missing fields, weak password, invalid email). |
| 409 | Email already registered. |
| 429 | Rate limit exceeded. |

---

### POST /api/auth/login

Authenticate with email and password.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | 5 requests / 15 min / IP |

**Request Body:**

```json
{
  "email": "maria@example.com",
  "password": "SecurePass1"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful.",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 5,
    "email": "maria@example.com",
    "first_name": "Maria",
    "last_name": "Rodriguez",
    "role": "client",
    "preferred_language": "es"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Validation errors. |
| 401 | Invalid email or password. |
| 403 | Account is deactivated. |
| 429 | Rate limit exceeded. |

---

### POST /api/auth/logout

Revoke the current refresh token and clear the cookie.

| Property | Value |
| -------- | ----- |
| Auth required | Yes (refresh token cookie) |
| Rate limit | General |

**Request Body:** None.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### POST /api/auth/refresh

Issue a new access token using the refresh token cookie.

| Property | Value |
| -------- | ----- |
| Auth required | No (uses httpOnly cookie) |
| Rate limit | General |

**Request Body:** None. The `refreshToken` cookie is sent automatically.

**Success Response (200):**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 401 | Missing, expired, or revoked refresh token. |

---

### POST /api/auth/forgot-password

Request a password-reset email.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | 3 requests / hour / IP |

**Request Body:**

```json
{
  "email": "maria@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "If the email is registered, a reset link has been sent."
}
```

The response is always 200 regardless of whether the email exists, to prevent user enumeration.

---

### POST /api/auth/reset-password

Reset the password using a token from the reset email.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | General |

**Request Body:**

```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "password": "NewSecurePass1"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Validation errors (weak password). |
| 400 | Invalid or expired token. |

---

### GET /api/auth/google

Initiate Google OAuth 2.0 login. Redirects the browser to Google's consent screen.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | General |

**Usage:** Navigate the browser to this URL (not an AJAX call).

---

### GET /api/auth/google/callback

Google OAuth callback. Receives the authorization code from Google, exchanges it for user info, creates or links the account, and redirects to the frontend with tokens.

| Property | Value |
| -------- | ----- |
| Auth required | No (Google handles auth) |
| Rate limit | General |

**Behavior:**
- On success: Sets the refresh token cookie and redirects to `CLIENT_URL/?token=<accessToken>`.
- On failure: Redirects to `CLIENT_URL/login?error=oauth_failed`.

---

### GET /api/auth/me

Get the currently authenticated user's profile.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Rate limit | General |
| Headers | `Authorization: Bearer <accessToken>` |

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": 5,
    "email": "maria@example.com",
    "first_name": "Maria",
    "last_name": "Rodriguez",
    "phone": "+504 0000-1234",
    "role": "client",
    "auth_provider": "local",
    "preferred_language": "es",
    "is_active": true,
    "email_verified": false,
    "created_at": "2026-04-01T10:00:00.000Z",
    "updated_at": "2026-04-01T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 401 | Missing or invalid access token. |

---

## Package Endpoints

Base path: `/api/packages`

### GET /api/packages

List all active packages for the public catalog.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | General |

**Success Response (200):**

```json
{
  "success": true,
  "packages": [
    {
      "id": 1,
      "name_es": "Chequeo General Completo",
      "name_en": "Complete General Checkup",
      "description_es": "Paquete integral de chequeo medico...",
      "description_en": "Comprehensive medical checkup...",
      "price": 150.00,
      "currency": "USD",
      "includes_es": "[\"Consulta medica general\",\"Examen de sangre completo\"]",
      "includes_en": "[\"General medical consultation\",\"Complete blood test\"]",
      "is_active": true,
      "display_order": 1,
      "created_at": "2026-04-01T00:00:00.000Z",
      "updated_at": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

> Note: `includes_es` and `includes_en` are JSON-encoded strings. The client must call `JSON.parse()` to get the array.

---

### GET /api/packages/:id

Get a single package by ID.

| Property | Value |
| -------- | ----- |
| Auth required | No |
| Rate limit | General |

**URL Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | `INT` | Package ID. |

**Success Response (200):**

```json
{
  "success": true,
  "package": {
    "id": 1,
    "name_es": "Chequeo General Completo",
    "name_en": "Complete General Checkup",
    "description_es": "...",
    "description_en": "...",
    "price": 150.00,
    "currency": "USD",
    "includes_es": "[...]",
    "includes_en": "[...]",
    "is_active": true,
    "display_order": 1,
    "created_at": "2026-04-01T00:00:00.000Z",
    "updated_at": "2026-04-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 404 | Package not found. |

---

## Order Endpoints

Base path: `/api/orders`

### POST /api/orders

Create a new order for the authenticated user.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `client` |
| Headers | `Authorization: Bearer <accessToken>` |

**Request Body:**

```json
{
  "packageId": 1
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Order created successfully.",
  "order": {
    "id": 10,
    "order_number": "CLN-20260404-0001",
    "user_id": 5,
    "package_id": 1,
    "amount": 150.00,
    "currency": "USD",
    "status": "pending",
    "payment_reference": null,
    "payment_method": null,
    "payment_date": null,
    "notes": null,
    "created_at": "2026-04-04T14:30:00.000Z",
    "updated_at": "2026-04-04T14:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Missing packageId or validation error. |
| 401 | Not authenticated. |
| 404 | Package not found or inactive. |

---

### GET /api/orders/my-orders

List all orders for the authenticated user.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `client` |
| Headers | `Authorization: Bearer <accessToken>` |

**Success Response (200):**

```json
{
  "success": true,
  "orders": [
    {
      "id": 10,
      "order_number": "CLN-20260404-0001",
      "user_id": 5,
      "package_id": 1,
      "amount": 150.00,
      "currency": "USD",
      "status": "paid",
      "payment_reference": "BAC-REF-123456",
      "payment_method": "bac_card",
      "payment_date": "2026-04-04T14:35:00.000Z",
      "notes": null,
      "created_at": "2026-04-04T14:30:00.000Z",
      "updated_at": "2026-04-04T14:35:00.000Z",
      "package_name_es": "Chequeo General Completo",
      "package_name_en": "Complete General Checkup"
    }
  ]
}
```

---

### GET /api/orders/:id

Get a single order by ID. Clients can only view their own orders.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Headers | `Authorization: Bearer <accessToken>` |

**URL Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | `INT` | Order ID. |

**Success Response (200):**

```json
{
  "success": true,
  "order": {
    "id": 10,
    "order_number": "CLN-20260404-0001",
    "user_id": 5,
    "package_id": 1,
    "amount": 150.00,
    "currency": "USD",
    "status": "paid",
    "payment_reference": "BAC-REF-123456",
    "payment_method": "bac_card",
    "payment_date": "2026-04-04T14:35:00.000Z",
    "notes": null,
    "created_at": "2026-04-04T14:30:00.000Z",
    "updated_at": "2026-04-04T14:35:00.000Z",
    "user_email": "maria@example.com",
    "user_first_name": "Maria",
    "user_last_name": "Rodriguez",
    "package_name_es": "Chequeo General Completo",
    "package_name_en": "Complete General Checkup"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 401 | Not authenticated. |
| 403 | Attempting to view another user's order (non-admin). |
| 404 | Order not found. |

---

### POST /api/orders/:id/payment-callback

Payment gateway callback endpoint. In the MVP this handles simulated payments; in production it will process the BAC payment gateway callback.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Headers | `Authorization: Bearer <accessToken>` |

**URL Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | `INT` | Order ID. |

**Request Body:**

```json
{
  "success": true,
  "paymentReference": "SIM-1712345678901",
  "paymentMethod": "simulated"
}
```

**Success Response (200) -- Payment Successful:**

```json
{
  "success": true,
  "message": "Payment processed successfully.",
  "order": {
    "id": 10,
    "order_number": "CLN-20260404-0001",
    "status": "paid",
    "payment_reference": "SIM-1712345678901",
    "payment_method": "simulated",
    "payment_date": "2026-04-04T14:35:00.000Z"
  }
}
```

**Success Response (200) -- Payment Failed:**

```json
{
  "success": false,
  "message": "Payment was not successful.",
  "order": {
    "id": 10,
    "status": "pending"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Invalid request body. |
| 401 | Not authenticated. |
| 404 | Order not found. |

---

## Admin Endpoints

Base path: `/api/admin`

All admin endpoints require authentication **and** the `admin` role.

**Required Headers for all admin endpoints:**

```
Authorization: Bearer <accessToken>
```

### GET /api/admin/dashboard

Get dashboard statistics.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Success Response (200):**

```json
{
  "success": true,
  "stats": {
    "total_orders": 47,
    "pending_orders": 5,
    "total_revenue": 12350.00,
    "total_users": 32
  }
}
```

---

### GET /api/admin/orders

List all orders with pagination, filtering, and search.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Query Parameters:**

| Parameter | Type | Default | Description |
| --------- | ---- | ------- | ----------- |
| `page` | `INT` | `1` | Page number. |
| `limit` | `INT` | `20` | Results per page. |
| `status` | `STRING` | -- | Filter by status (`pending`, `paid`, `in_progress`, `completed`, `cancelled`). |
| `search` | `STRING` | -- | Search in order number, user email, first name, or last name. |

**Success Response (200):**

```json
{
  "success": true,
  "orders": [ ... ],
  "total": 47,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### GET /api/admin/orders/:id

Get full order detail including user info and status history.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Success Response (200):**

```json
{
  "success": true,
  "order": {
    "id": 10,
    "order_number": "CLN-20260404-0001",
    "user_id": 5,
    "package_id": 1,
    "amount": 150.00,
    "currency": "USD",
    "status": "paid",
    "payment_reference": "BAC-REF-123456",
    "payment_method": "bac_card",
    "payment_date": "2026-04-04T14:35:00.000Z",
    "notes": null,
    "created_at": "2026-04-04T14:30:00.000Z",
    "updated_at": "2026-04-04T14:35:00.000Z",
    "user_email": "maria@example.com",
    "user_first_name": "Maria",
    "user_last_name": "Rodriguez",
    "package_name_es": "Chequeo General Completo",
    "package_name_en": "Complete General Checkup"
  },
  "statusHistory": [
    {
      "id": 1,
      "order_id": 10,
      "previous_status": null,
      "new_status": "pending",
      "changed_by": 5,
      "changed_by_first_name": "Maria",
      "changed_by_last_name": "Rodriguez",
      "notes": null,
      "created_at": "2026-04-04T14:30:00.000Z"
    },
    {
      "id": 2,
      "order_id": 10,
      "previous_status": "pending",
      "new_status": "paid",
      "changed_by": 5,
      "changed_by_first_name": "Maria",
      "changed_by_last_name": "Rodriguez",
      "notes": null,
      "created_at": "2026-04-04T14:35:00.000Z"
    }
  ]
}
```

---

### PATCH /api/admin/orders/:id/status

Update the status of an order. Enforces valid state transitions.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Request Body:**

```json
{
  "status": "in_progress",
  "notes": "Patient appointment scheduled for April 10."
}
```

**Valid Transitions:**

| Current Status | Allowed Next Statuses |
| -------------- | -------------------- |
| `pending` | `paid`, `cancelled` |
| `paid` | `in_progress`, `cancelled` |
| `in_progress` | `completed`, `cancelled` |
| `completed` | *(none)* |
| `cancelled` | *(none)* |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Order status updated.",
  "order": {
    "id": 10,
    "status": "in_progress",
    "updated_at": "2026-04-05T09:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Invalid status transition. |
| 404 | Order not found. |

---

### GET /api/admin/packages

List all packages (including inactive) for admin management.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Success Response (200):**

```json
{
  "success": true,
  "packages": [
    {
      "id": 1,
      "name_es": "Chequeo General Completo",
      "name_en": "Complete General Checkup",
      "price": 150.00,
      "currency": "USD",
      "is_active": true,
      "display_order": 1,
      "created_at": "2026-04-01T00:00:00.000Z",
      "updated_at": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/admin/packages

Create a new package.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Request Body:**

```json
{
  "name_es": "Paquete Oftalmologico",
  "name_en": "Ophthalmology Package",
  "description_es": "Evaluacion completa de la vision...",
  "description_en": "Complete vision evaluation...",
  "price": 200.00,
  "currency": "USD",
  "includes_es": "[\"Consulta oftalmologica\",\"Examen de agudeza visual\"]",
  "includes_en": "[\"Ophthalmological consultation\",\"Visual acuity test\"]",
  "display_order": 5
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Package created successfully.",
  "package": { ... }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Validation errors. |

---

### PUT /api/admin/packages/:id

Update an existing package. Only provided fields are changed.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Request Body (partial update):**

```json
{
  "price": 225.00,
  "description_es": "Evaluacion oftalmologica actualizada..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Package updated successfully.",
  "package": { ... }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 400 | Validation errors. |
| 404 | Package not found. |

---

### PATCH /api/admin/packages/:id/toggle

Toggle a package's `is_active` status (activate/deactivate).

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Request Body:** None.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Package status toggled.",
  "package": {
    "id": 1,
    "is_active": false,
    "updated_at": "2026-04-05T09:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition |
| ------ | --------- |
| 404 | Package not found. |

---

### GET /api/admin/users

List all registered users with their order counts.

| Property | Value |
| -------- | ----- |
| Auth required | Yes |
| Role required | `admin` |

**Success Response (200):**

```json
{
  "success": true,
  "users": [
    {
      "id": 5,
      "email": "maria@example.com",
      "first_name": "Maria",
      "last_name": "Rodriguez",
      "phone": "+504 0000-1234",
      "role": "client",
      "auth_provider": "local",
      "preferred_language": "es",
      "is_active": true,
      "email_verified": false,
      "created_at": "2026-04-01T10:00:00.000Z",
      "updated_at": "2026-04-01T10:00:00.000Z",
      "order_count": 3
    }
  ]
}
```

---

## Common Error Responses

These apply across all endpoints:

| Status | Condition | Example Body |
| ------ | --------- | ------------ |
| 401 | Missing or invalid access token. | `{ "success": false, "message": "Access denied. No token provided." }` |
| 401 | Expired access token. | `{ "success": false, "message": "Token has expired.", "code": "TOKEN_EXPIRED" }` |
| 403 | Insufficient role. | `{ "success": false, "message": "You do not have permission to perform this action." }` |
| 429 | Rate limit exceeded. | `{ "success": false, "message": "Too many requests. Please try again later." }` |
| 500 | Internal server error (production). | `{ "success": false, "message": "An internal server error occurred." }` |

## Rate Limiting Summary

| Limiter | Endpoints | Max Requests | Window |
| ------- | --------- | ------------ | ------ |
| `loginLimiter` | `POST /auth/login` | 5 | 15 minutes |
| `registerLimiter` | `POST /auth/register` | 3 | 1 hour |
| `forgotPasswordLimiter` | `POST /auth/forgot-password` | 3 | 1 hour |
| `generalLimiter` | All other endpoints | 100 (configurable) | 15 minutes (configurable) |
