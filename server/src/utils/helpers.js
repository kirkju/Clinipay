const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * Generate a signed JWT.
 */
function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws on invalid / expired tokens.
 */
function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * Hash a plain-text password with bcrypt.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random hex token (64 chars).
 * Used for password-reset links and similar one-time tokens.
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateRandomToken,
};
