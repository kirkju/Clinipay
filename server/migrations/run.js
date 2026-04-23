const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'clinipay',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

const TRACKER_DDL = `
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='schema_migrations' AND xtype='U')
BEGIN
  CREATE TABLE schema_migrations (
    filename   NVARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
  );
END
`;

async function runMigrations() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server');

    await pool.request().query(TRACKER_DDL);

    const appliedResult = await pool.request()
      .query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedResult.recordset.map((r) => r.filename));

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  - ${file} already applied, skipping`);
        skippedCount++;
        continue;
      }

      console.log(`Running migration: ${file}`);
      const script = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      const transaction = new sql.Transaction(pool);
      try {
        await transaction.begin();
        await new sql.Request(transaction).query(script);
        await new sql.Request(transaction)
          .input('filename', sql.NVarChar(255), file)
          .query('INSERT INTO schema_migrations (filename) VALUES (@filename)');
        await transaction.commit();
        console.log(`  ✓ ${file} completed`);
        appliedCount++;
      } catch (err) {
        try { await transaction.rollback(); } catch { /* rollback may fail if txn aborted */ }
        throw err;
      }
    }

    console.log(`\nDone: ${appliedCount} applied, ${skippedCount} already up-to-date.`);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

runMigrations();
