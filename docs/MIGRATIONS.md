# Migrations — CLINIPAY

How the backend migration system works and how to work with it.

---

## What is a migration

A `.sql` file inside [`server/migrations/`](../server/migrations/) that modifies the database schema: creating tables, adding columns, indexes, etc. Migrations are numbered and ordered (`001_...`, `002_...`, `010_...`) so they run sequentially.

## How to run them

From the `server/` folder:

```bash
npm run migrate
```

That runs `node migrations/run.js`, which connects to SQL Server using the `.env` variables and applies any pending migrations.

## How it knows which ones already ran

The runner maintains a control table called **`schema_migrations`** with two columns:

| Column | Type | Description |
|---|---|---|
| `filename` | NVARCHAR(255) PK | Name of the applied `.sql` file |
| `applied_at` | DATETIME2 | UTC timestamp of when it was applied |

Every time you run `npm run migrate`:

1. It ensures the `schema_migrations` table exists (creates it on first run).
2. Reads the filenames already recorded.
3. Lists every `.sql` in `server/migrations/` sorted alphabetically.
4. **Skips** the ones already in the table (log: `- file.sql already applied, skipping`).
5. **Applies** the new ones inside a transaction: if the SQL succeeds, the filename is inserted; if it fails, full rollback and nothing gets marked as applied.
6. Reports at the end: `Done: N applied, M already up-to-date.`

### Benefits

- You don't have to worry about already-applied migrations being re-run.
- If a migration fails midway, the rollback leaves it as not-applied so you can retry it.
- You know exactly which migrations each environment has by querying `SELECT * FROM schema_migrations`.

---

## How to create a new migration

1. Create a new file inside `server/migrations/` following the numbering:
   ```
   012_short_description.sql
   ```
2. Write it **idempotent** (see golden rule below).
3. Run `npm run migrate`.

### Golden rule: write them idempotent

Even though the tracker prevents re-runs, it's good practice for each migration to stay safe when executed twice. That protects against edge cases (DB restore, copying to another environment, etc.).

**Patterns used across the project:**

#### Create a table
```sql
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='my_table' AND xtype='U')
BEGIN
    CREATE TABLE my_table (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ...
    );
END
```

#### Add a column
```sql
IF COL_LENGTH('my_table', 'my_column') IS NULL
    ALTER TABLE my_table ADD my_column NVARCHAR(100) NULL;
```

#### Create an index
```sql
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_my_table_field')
    CREATE INDEX IX_my_table_field ON my_table(field);
```

#### Rename a column
```sql
IF COL_LENGTH('my_table', 'old_name') IS NOT NULL
   AND COL_LENGTH('my_table', 'new_name') IS NULL
    EXEC sp_rename 'my_table.old_name', 'new_name', 'COLUMN';
```

#### Add a constraint with an explicit name
Use explicit names (`CONSTRAINT DF_table_column DEFAULT 0`, `CONSTRAINT CK_table_column CHECK (...)`). That way you can drop them later by name instead of relying on SQL Server's auto-generated ones.

### What a migration must NOT do

- **Delete production data without guards.** If you need to clean up test data, wrap the block in a guard that detects whether it already ran (e.g., check that another table doesn't exist yet).
- **Depend on prior data state.** A migration must work both on an empty DB and on one with lots of data.
- **Mix schema changes with large data loads.** If you need to load initial catalogs, do it in a separate seed file — not in a migration.

---

## Common operations

### See which migrations are applied
```sql
SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at;
```

### Re-run a migration on purpose

```sql
DELETE FROM schema_migrations WHERE filename = '008_create_order_items.sql';
```

Then `npm run migrate` will apply it again. Only makes sense if the migration is idempotent.

### Mark a migration as applied without running it

Useful if you've already applied the changes manually and want the tracker to know:

```sql
INSERT INTO schema_migrations (filename) VALUES ('XXX_name.sql');
```

### Fully reset the tracker

```sql
DROP TABLE schema_migrations;
```

The next run will recreate it and retry every migration (only safe if all migrations are idempotent).

---

## Current migrations

| # | File | What it does |
|---|---|---|
| 001 | `001_create_users.sql` | `users` table with local + Google auth |
| 002 | `002_create_packages.sql` | `packages` table (bilingual catalog) |
| 003 | `003_create_orders.sql` | `orders` table |
| 004 | `004_create_order_status_history.sql` | Status change history |
| 005 | `005_create_refresh_tokens.sql` | JWT refresh tokens |
| 006 | `006_create_password_reset_tokens.sql` | Password reset tokens |
| 007 | `007_create_performance_indexes.sql` | Performance indexes for common queries |
| 008 | `008_create_order_items.sql` | Refactor to multi-item order with patient info |
| 009 | `009_add_soft_delete.sql` | `deleted_at` column on core tables |
| 010 | `010_add_package_discount.sql` | `discount_percentage` column on `packages` |
| 011 | `011_add_senior_discount_flag.sql` | `senior_discount_enabled` column on `packages` |

---

## Troubleshooting

### "The DELETE statement conflicted with the REFERENCE constraint..."

A migration tried to delete rows referenced by another table via FK. Typical cause: the migration got re-run over data that already had children in another table. Migration 008 had this issue; it was fixed by wrapping the DELETE in a guard that skips it if `order_items` already exists.

### "There is already an object named 'X' in the database"

The migration is missing an `IF NOT EXISTS` guard for a table/index/constraint. Add the guard and re-run. If it was already recorded as applied before the error, remove it from the tracker with the `DELETE` above.

### The runner hangs

Check that `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` are set correctly in `server/.env`. Also verify SQL Server is reachable from where you're running the command (firewall, TCP/IP enabled in SQL Server Configuration Manager on Windows).

### A migration fails midway

The runner automatically rolls back inside a transaction, so the DB stays exactly as it was before that migration. Fix: edit the file, resolve the problem, and run `npm run migrate` again. It won't be marked as applied until it passes fully.

### I want to apply a migration manually and have the tracker skip it

1. Apply the SQL by hand from SSMS / Azure Data Studio.
2. Insert the record:
   ```sql
   INSERT INTO schema_migrations (filename) VALUES ('XXX_name.sql');
   ```
3. The next `npm run migrate` will skip it.

---

## Key files

- [`server/migrations/run.js`](../server/migrations/run.js) — the runner with tracker.
- [`server/migrations/`](../server/migrations/) — the migrations.
- [`server/.env`](../server/.env) — DB credentials (do not commit).
- [`server/package.json`](../server/package.json) — `migrate` script.
