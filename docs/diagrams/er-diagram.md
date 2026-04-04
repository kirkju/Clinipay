# Entity-Relationship Diagram

```mermaid
erDiagram
    users {
        INT id PK "IDENTITY(1,1)"
        NVARCHAR255 email UK "NOT NULL, UNIQUE"
        NVARCHAR255 password_hash "NULL (Google users)"
        NVARCHAR100 first_name "NOT NULL"
        NVARCHAR100 last_name "NOT NULL"
        NVARCHAR20 phone "NULL"
        NVARCHAR20 role "NOT NULL, DEFAULT 'client'"
        NVARCHAR20 auth_provider "NOT NULL, DEFAULT 'local'"
        NVARCHAR255 google_id "NULL"
        NVARCHAR5 preferred_language "NOT NULL, DEFAULT 'es'"
        BIT is_active "NOT NULL, DEFAULT 1"
        BIT email_verified "NOT NULL, DEFAULT 0"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
        DATETIME2 updated_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    packages {
        INT id PK "IDENTITY(1,1)"
        NVARCHAR200 name_es "NOT NULL"
        NVARCHAR200 name_en "NOT NULL"
        NVARCHARMAX description_es "NOT NULL"
        NVARCHARMAX description_en "NOT NULL"
        DECIMAL10_2 price "NOT NULL"
        NVARCHAR3 currency "NOT NULL, DEFAULT 'USD'"
        NVARCHARMAX includes_es "NULL (JSON string)"
        NVARCHARMAX includes_en "NULL (JSON string)"
        BIT is_active "NOT NULL, DEFAULT 1"
        INT display_order "NOT NULL, DEFAULT 0"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
        DATETIME2 updated_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    orders {
        INT id PK "IDENTITY(1,1)"
        NVARCHAR50 order_number UK "NOT NULL, UNIQUE"
        INT user_id FK "NOT NULL"
        INT package_id FK "NOT NULL"
        DECIMAL10_2 amount "NOT NULL"
        NVARCHAR3 currency "NOT NULL, DEFAULT 'USD'"
        NVARCHAR30 status "NOT NULL, DEFAULT 'pending'"
        NVARCHAR255 payment_reference "NULL"
        NVARCHAR50 payment_method "NULL"
        DATETIME2 payment_date "NULL"
        NVARCHARMAX notes "NULL"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
        DATETIME2 updated_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    order_status_history {
        INT id PK "IDENTITY(1,1)"
        INT order_id FK "NOT NULL"
        NVARCHAR30 previous_status "NULL"
        NVARCHAR30 new_status "NOT NULL"
        INT changed_by FK "NOT NULL"
        NVARCHAR500 notes "NULL"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    refresh_tokens {
        INT id PK "IDENTITY(1,1)"
        INT user_id FK "NOT NULL"
        NVARCHAR255 token_hash "NOT NULL"
        DATETIME2 expires_at "NOT NULL"
        BIT is_revoked "NOT NULL, DEFAULT 0"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    password_reset_tokens {
        INT id PK "IDENTITY(1,1)"
        INT user_id FK "NOT NULL"
        NVARCHAR255 token_hash "NOT NULL"
        DATETIME2 expires_at "NOT NULL"
        BIT is_used "NOT NULL, DEFAULT 0"
        DATETIME2 created_at "NOT NULL, DEFAULT GETUTCDATE()"
    }

    users ||--o{ orders : "places"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o{ order_status_history : "changes (as changed_by)"
    packages ||--o{ orders : "purchased as"
    orders ||--o{ order_status_history : "has history"
```

## Relationships

| Relationship | Cardinality | Description |
| ------------ | ----------- | ----------- |
| `users` -> `orders` | One-to-Many | A user can place many orders. Each order belongs to one user. |
| `packages` -> `orders` | One-to-Many | A package can appear in many orders. Each order references one package. |
| `orders` -> `order_status_history` | One-to-Many | An order has many status change records forming an audit trail. |
| `users` -> `order_status_history` | One-to-Many | A user (admin or system) makes status changes. Each record tracks who changed it. |
| `users` -> `refresh_tokens` | One-to-Many | A user can have multiple active refresh tokens (e.g., multiple devices). |
| `users` -> `password_reset_tokens` | One-to-Many | A user can request multiple password resets. Only the latest unused, non-expired token is valid. |

## Notes

- `includes_es` and `includes_en` in `packages` store JSON arrays as `NVARCHAR(MAX)` strings (e.g., `'["item1","item2"]'`).
- `order_number` follows the format `CLN-YYYYMMDD-NNNN` and is unique across all orders.
- `status` in `orders` is constrained by application logic to: `pending`, `paid`, `in_progress`, `completed`, `cancelled`.
- Token tables store only hashed values -- never plaintext tokens.
- `password_hash` in `users` is `NULL` for Google-only users who have never set a local password.
