const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'clinipay',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 15000,
};

let pool = null;

/**
 * Connect to SQL Server and return the connection pool.
 * Reuses the existing pool if already connected.
 */
async function connectDB() {
  if (pool) {
    return pool;
  }
  try {
    pool = await sql.connect(dbConfig);
    console.log(`[DB] Connected to SQL Server: ${dbConfig.server}/${dbConfig.database}`);
    return pool;
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Return the current pool, connecting first if necessary.
 */
async function getPool() {
  if (!pool) {
    await connectDB();
  }
  return pool;
}

module.exports = { connectDB, getPool, sql };
