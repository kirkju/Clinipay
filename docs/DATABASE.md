# Database Schema

CLINIPAY uses **Microsoft SQL Server** accessed via the [`mssql`](https://www.npmjs.com/package/mssql) Node.js driver with parameterized queries. The schema consists of six tables created by sequential migration files in `server/migrations/`.

See also: [ER Diagram](./diagrams/er-diagram.md)

---

## Table: `users`

Stores all registered users (clients and admins). Supports both local (email + password) and Google OAuth authentication.

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique user identifier. |
| `email` | `NVARCHAR(255)` | `NOT NULL`, `UNIQUE` | -- | User email address. Used as login identifier. |
| `password_hash` | `NVARCHAR(255)` | `NULL` | `NULL` | Bcrypt hash (12 salt rounds). NULL for Google-only users. |
| `first_name` | `NVARCHAR(100)` | `NOT NULL` | -- | User first name. |
| `last_name` | `NVARCHAR(100)` | `NOT NULL` | -- | User last name. |
| `phone` | `NVARCHAR(20)` | `NULL` | `NULL` | Optional phone number. |
| `role` | `NVARCHAR(20)` | `NOT NULL` | `'client'` | User role. Values: `client`, `admin`. |
| `auth_provider` | `NVARCHAR(20)` | `NOT NULL` | `'local'` | Authentication provider. Values: `local`, `google`. |
| `google_id` | `NVARCHAR(255)` | `NULL` | `NULL` | Google OAuth profile ID. Set when user links or signs up via Google. |
| `preferred_language` | `NVARCHAR(5)` | `NOT NULL` | `'es'` | UI language preference. Values: `es`, `en`. |
| `is_active` | `BIT` | `NOT NULL` | `1` | Whether the user account is active. |
| `email_verified` | `BIT` | `NOT NULL` | `0` | Whether the email has been verified. |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Record creation timestamp (UTC). |
| `updated_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Last update timestamp (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_users_email` | `email` | Fast lookup by email on login. |
| `IX_users_google_id` | `google_id` | Fast lookup for Google OAuth flow. |

---

## Table: `packages`

Medical service packages available for purchase. All text fields are bilingual (Spanish and English).

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique package identifier. |
| `name_es` | `NVARCHAR(200)` | `NOT NULL` | -- | Package name in Spanish. |
| `name_en` | `NVARCHAR(200)` | `NOT NULL` | -- | Package name in English. |
| `description_es` | `NVARCHAR(MAX)` | `NOT NULL` | -- | Full description in Spanish. |
| `description_en` | `NVARCHAR(MAX)` | `NOT NULL` | -- | Full description in English. |
| `price` | `DECIMAL(10,2)` | `NOT NULL` | -- | Package price. |
| `currency` | `NVARCHAR(3)` | `NOT NULL` | `'USD'` | ISO 4217 currency code. |
| `includes_es` | `NVARCHAR(MAX)` | `NULL` | `NULL` | JSON-encoded array of included items in Spanish. |
| `includes_en` | `NVARCHAR(MAX)` | `NULL` | `NULL` | JSON-encoded array of included items in English. |
| `is_active` | `BIT` | `NOT NULL` | `1` | Whether the package is visible to clients. |
| `display_order` | `INT` | `NOT NULL` | `0` | Sort order for catalog display (ascending). |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Record creation timestamp (UTC). |
| `updated_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Last update timestamp (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_packages_is_active` | `is_active` | Filter active packages for public catalog. |
| `IX_packages_display_order` | `display_order` | Sort packages for display. |

### Note on `includes_es` / `includes_en`

These columns store a **JSON array serialized as a string** (e.g., `'["Consulta medica","Examen de sangre"]'`). The application is responsible for calling `JSON.stringify()` on write and `JSON.parse()` on read. SQL Server's `NVARCHAR(MAX)` column type is used because SQL Server 2019's native `JSON` support does not provide a dedicated column type, and this approach keeps the schema simple for the MVP.

**Example stored value:**
```json
["Consulta medica general","Examen de sangre completo (hemograma)","Examen de orina"]
```

---

## Table: `orders`

Purchase orders created when a client buys a package.

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique order identifier. |
| `order_number` | `NVARCHAR(50)` | `NOT NULL`, `UNIQUE` | -- | Human-readable order number. Format: `CLN-YYYYMMDD-NNNN`. |
| `user_id` | `INT` | `NOT NULL`, `FK → users(id)` | -- | The client who placed the order. |
| `package_id` | `INT` | `NOT NULL`, `FK → packages(id)` | -- | The purchased package. |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | -- | Amount charged (snapshot of package price at time of purchase). |
| `currency` | `NVARCHAR(3)` | `NOT NULL` | `'USD'` | ISO 4217 currency code. |
| `status` | `NVARCHAR(30)` | `NOT NULL` | `'pending'` | Current order status. See [Order States](./diagrams/order-states.md). |
| `payment_reference` | `NVARCHAR(255)` | `NULL` | `NULL` | Payment gateway transaction reference. |
| `payment_method` | `NVARCHAR(50)` | `NULL` | `NULL` | Payment method used (e.g., `bac_card`, `simulated`). |
| `payment_date` | `DATETIME2` | `NULL` | `NULL` | When the payment was confirmed. |
| `notes` | `NVARCHAR(MAX)` | `NULL` | `NULL` | Admin notes about the order. |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Record creation timestamp (UTC). |
| `updated_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Last update timestamp (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_orders_user_id` | `user_id` | List orders by user. |
| `IX_orders_package_id` | `package_id` | Find orders for a specific package. |
| `IX_orders_status` | `status` | Filter by order status (admin dashboard). |
| `IX_orders_order_number` | `order_number` | Search by order number. |
| `IX_orders_created_at` | `created_at` | Sort by date. |

### Order Number Format

Order numbers follow the pattern **`CLN-YYYYMMDD-NNNN`** where:
- `CLN` is the CLINIPAY prefix.
- `YYYYMMDD` is the creation date.
- `NNNN` is a zero-padded sequential number within that date, starting at 0001.

Example: `CLN-20260404-0003` (third order on April 4, 2026).

### Order Statuses

| Status | Description |
| ------ | ----------- |
| `pending` | Order created, awaiting payment. |
| `paid` | Payment confirmed by the gateway. |
| `in_progress` | Medical service is being delivered. |
| `completed` | Service fully delivered. |
| `cancelled` | Order was cancelled. |

---

## Table: `order_status_history`

Audit trail for every status change on an order.

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique history entry identifier. |
| `order_id` | `INT` | `NOT NULL`, `FK → orders(id)` | -- | The order that changed status. |
| `previous_status` | `NVARCHAR(30)` | `NULL` | `NULL` | Status before the change. NULL for the initial creation entry. |
| `new_status` | `NVARCHAR(30)` | `NOT NULL` | -- | Status after the change. |
| `changed_by` | `INT` | `NOT NULL`, `FK → users(id)` | -- | User who made the change (admin or system). |
| `notes` | `NVARCHAR(500)` | `NULL` | `NULL` | Optional notes explaining the status change. |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Timestamp of the change (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_order_status_history_order_id` | `order_id` | Fetch full history for an order. |

---

## Table: `refresh_tokens`

Stores hashed refresh tokens for the JWT authentication flow. Tokens are never stored in plaintext.

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique token record identifier. |
| `user_id` | `INT` | `NOT NULL`, `FK → users(id)` | -- | The user this token belongs to. |
| `token_hash` | `NVARCHAR(255)` | `NOT NULL` | -- | SHA-256 (or bcrypt) hash of the refresh token. |
| `expires_at` | `DATETIME2` | `NOT NULL` | -- | When this token expires. |
| `is_revoked` | `BIT` | `NOT NULL` | `0` | Whether this token has been revoked (on logout or password change). |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Token creation timestamp (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_refresh_tokens_user_id` | `user_id` | Revoke all tokens for a user. |
| `IX_refresh_tokens_token_hash` | `token_hash` | Look up a token by hash during refresh. |

---

## Table: `password_reset_tokens`

Stores hashed password-reset tokens sent via email for the forgot-password flow.

| Column | Type | Constraints | Default | Description |
| ------ | ---- | ----------- | ------- | ----------- |
| `id` | `INT` | `PRIMARY KEY`, `IDENTITY(1,1)` | Auto-increment | Unique token record identifier. |
| `user_id` | `INT` | `NOT NULL`, `FK → users(id)` | -- | The user requesting the reset. |
| `token_hash` | `NVARCHAR(255)` | `NOT NULL` | -- | Hash of the reset token sent to the user's email. |
| `expires_at` | `DATETIME2` | `NOT NULL` | -- | Token expiration time (typically 1 hour after creation). |
| `is_used` | `BIT` | `NOT NULL` | `0` | Whether this token has already been used. Prevents reuse. |
| `created_at` | `DATETIME2` | `NOT NULL` | `GETUTCDATE()` | Token creation timestamp (UTC). |

**Indexes:**

| Index | Column(s) | Notes |
| ----- | --------- | ----- |
| `IX_password_reset_tokens_user_id` | `user_id` | Find tokens by user for cleanup. |
| `IX_password_reset_tokens_token_hash` | `token_hash` | Look up token by hash during password reset. |

---

## Recommended Additional Indexes (Production)

For high-traffic production deployments, consider adding:

| Table | Index | Rationale |
| ----- | ----- | --------- |
| `orders` | `(user_id, created_at DESC)` | Composite index for the "my orders" query. |
| `orders` | `(status, created_at DESC)` | Composite index for admin filtered order listing. |
| `refresh_tokens` | `(expires_at) WHERE is_revoked = 0` | Filtered index for cleanup jobs that purge expired tokens. |
| `password_reset_tokens` | `(expires_at) WHERE is_used = 0` | Filtered index for cleanup jobs. |

---

## Relationships Summary

```
users (1) ──────── (N) orders
users (1) ──────── (N) refresh_tokens
users (1) ──────── (N) password_reset_tokens
users (1) ──────── (N) order_status_history  (as changed_by)
packages (1) ───── (N) orders
orders (1) ──────── (N) order_status_history
```

---

## Migration & Seed Commands

```bash
# Run all migrations (creates tables if they don't exist)
cd server
npm run migrate

# Seed admin user and sample packages
npm run seed
```

The migration runner (`migrations/run.js`) reads all `.sql` files in alphabetical order and executes them sequentially. Each migration uses `IF NOT EXISTS` guards, making them safe to re-run.

## References

- [ER Diagram](./diagrams/er-diagram.md)
- [Order States Diagram](./diagrams/order-states.md)
