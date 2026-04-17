const { getPool, sql } = require('../config/db');

const UserModel = {
  /**
   * Find a user by email address (excludes soft-deleted).
   */
  async findByEmail(email) {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT * FROM users WHERE email = @email AND deleted_at IS NULL');
    return result.recordset[0] || null;
  },

  /**
   * Find a user by primary key (excludes soft-deleted).
   */
  async findById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id = @id AND deleted_at IS NULL');
    return result.recordset[0] || null;
  },

  /**
   * Find a user by Google OAuth ID (excludes soft-deleted).
   */
  async findByGoogleId(googleId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('google_id', sql.NVarChar(255), googleId)
      .query('SELECT * FROM users WHERE google_id = @google_id AND deleted_at IS NULL');
    return result.recordset[0] || null;
  },

  /**
   * Create a new user and return the created record.
   */
  async create({
    email,
    password_hash,
    first_name,
    last_name,
    phone = null,
    role = 'client',
    auth_provider = 'local',
    google_id = null,
    preferred_language = 'es',
  }) {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.NVarChar(255), password_hash)
      .input('first_name', sql.NVarChar(100), first_name)
      .input('last_name', sql.NVarChar(100), last_name)
      .input('phone', sql.NVarChar(20), phone)
      .input('role', sql.NVarChar(20), role)
      .input('auth_provider', sql.NVarChar(20), auth_provider)
      .input('google_id', sql.NVarChar(255), google_id)
      .input('preferred_language', sql.NVarChar(5), preferred_language)
      .query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role, auth_provider, google_id, preferred_language)
        OUTPUT INSERTED.*
        VALUES (@email, @password_hash, @first_name, @last_name, @phone, @role, @auth_provider, @google_id, @preferred_language)
      `);
    return result.recordset[0];
  },

  /**
   * Update a user's password hash.
   */
  async updatePassword(userId, passwordHash) {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, userId)
      .input('password_hash', sql.NVarChar(255), passwordHash)
      .query('UPDATE users SET password_hash = @password_hash, updated_at = GETUTCDATE() WHERE id = @id AND deleted_at IS NULL');
  },

  /**
   * Get all non-deleted users with their order count (admin view).
   */
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT
          u.id, u.email, u.first_name, u.last_name, u.phone,
          u.role, u.auth_provider, u.preferred_language,
          u.is_active, u.email_verified, u.created_at, u.updated_at,
          COUNT(o.id) AS order_count
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone,
                 u.role, u.auth_provider, u.preferred_language,
                 u.is_active, u.email_verified, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
      `);
    return result.recordset;
  },

  /**
   * Link a Google account to an existing user.
   */
  async linkGoogleAccount(userId, googleId) {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, userId)
      .input('google_id', sql.NVarChar(255), googleId)
      .query(`
        UPDATE users
        SET google_id = @google_id, updated_at = GETUTCDATE()
        WHERE id = @id AND deleted_at IS NULL
      `);
  },

  /**
   * Update a user's role.
   */
  async updateRole(id, role) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('role', sql.NVarChar(20), role)
      .query(`
        UPDATE users SET role = @role, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND deleted_at IS NULL
      `);
    return result.recordset[0] || null;
  },

  /**
   * Soft-delete a user by setting deleted_at.
   */
  async softDelete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE users
        SET deleted_at = GETUTCDATE(), is_active = 0, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND deleted_at IS NULL
      `);
    return result.recordset[0] || null;
  },
};

module.exports = UserModel;
