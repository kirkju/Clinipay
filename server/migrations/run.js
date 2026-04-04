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

async function runMigrations() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server');

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const script = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.request().query(script);
      console.log(`  ✓ ${file} completed`);
    }

    console.log('\nAll migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

runMigrations();
