const { getPool, sql } = require('../config/db');

const TokenModel = {
  // ── Refresh Tokens ──────────────────────────────────────────────

  /**
   * Store a hashed refresh token.
   */
  async createRefreshToken(userId, tokenHash, expiresAt) {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .input('expires_at', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (@user_id, @token_hash, @expires_at)
      `);
  },

  /**
   * Find a non-revoked, non-expired refresh token by its hash.
   */
  async findByTokenHash(tokenHash) {
    const pool = await getPool();
    const result = await pool.request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT * FROM refresh_tokens
        WHERE token_hash = @token_hash
          AND is_revoked = 0
          AND expires_at > GETUTCDATE()
      `);
    return result.recordset[0] || null;
  },

  /**
   * Revoke a single refresh token by hash.
   */
  async revokeToken(tokenHash) {
    const pool = await getPool();
    await pool.request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = @token_hash');
  },

  /**
   * Revoke all refresh tokens for a user (e.g. on password change).
   */
  async revokeAllUserTokens(userId) {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = @user_id');
  },

  // ── Password Reset Tokens ──────────────────────────────────────

  /**
   * Store a hashed password-reset token.
   */
  async createResetToken(userId, tokenHash, expiresAt) {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .input('expires_at', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (@user_id, @token_hash, @expires_at)
      `);
  },

  /**
   * Find a valid (unused, non-expired) password-reset token by hash.
   */
  async findValidResetToken(tokenHash) {
    const pool = await getPool();
    const result = await pool.request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT * FROM password_reset_tokens
        WHERE token_hash = @token_hash
          AND is_used = 0
          AND expires_at > GETUTCDATE()
      `);
    return result.recordset[0] || null;
  },

  /**
   * Mark a password-reset token as used.
   */
  async markResetTokenUsed(tokenHash) {
    const pool = await getPool();
    await pool.request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query('UPDATE password_reset_tokens SET is_used = 1 WHERE token_hash = @token_hash');
  },
};

module.exports = TokenModel;
