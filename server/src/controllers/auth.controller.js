const crypto = require('crypto');
const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const EmailService = require('../services/email.service');
const {
  generateToken,
  hashPassword,
  comparePassword,
  generateRandomToken,
} = require('../utils/helpers');

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Issue access + refresh tokens. Stores the refresh token hash in the DB
 * and sets it as an httpOnly cookie.
 */
async function issueTokens(res, user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateToken(payload, process.env.JWT_SECRET, ACCESS_TOKEN_EXPIRY);

  // Refresh token
  const rawRefresh = generateRandomToken();
  const refreshHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await TokenModel.createRefreshToken(user.id, refreshHash, expiresAt);

  // Set httpOnly cookie
  res.cookie('refreshToken', rawRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/',
  });

  return accessToken;
}

const AuthController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, first_name, last_name, phone, preferred_language } = req.body;

      // Check for existing user
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email is already registered.' });
      }

      const password_hash = await hashPassword(password);
      const user = await UserModel.create({
        email,
        password_hash,
        first_name,
        last_name,
        phone: phone || null,
        role: 'client',
        auth_provider: 'local',
        google_id: null,
        preferred_language: preferred_language || 'es',
      });

      // Send welcome email (fire-and-forget)
      EmailService.sendWelcomeEmail(user, user.preferred_language);

      const accessToken = await issueTokens(res, user);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user: sanitizeUser(user),
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.auth_provider === 'google' && !user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'This account uses Google sign-in. Please log in with Google.',
        });
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }

      const accessToken = await issueTokens(res, user);

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: sanitizeUser(user),
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const rawRefresh = req.cookies?.refreshToken;
      if (rawRefresh) {
        const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
        await TokenModel.revokeToken(hash);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const rawRefresh = req.cookies?.refreshToken;
      if (!rawRefresh) {
        return res.status(401).json({ success: false, message: 'No refresh token provided.' });
      }

      const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
      const storedToken = await TokenModel.findByTokenHash(hash);
      if (!storedToken) {
        res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
      }

      const user = await UserModel.findById(storedToken.user_id);
      if (!user || !user.is_active) {
        await TokenModel.revokeToken(hash);
        res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
        return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
      }

      // Revoke old refresh token and issue new pair
      await TokenModel.revokeToken(hash);

      const accessToken = await issueTokens(res, user);

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Always respond the same way to prevent email enumeration
      const successMsg = 'If the email exists, a password reset link has been sent.';

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.json({ success: true, message: successMsg });
      }

      const rawToken = generateRandomToken();
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await TokenModel.createResetToken(user.id, tokenHash, expiresAt);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

      EmailService.sendPasswordResetEmail(user, resetUrl, user.preferred_language);

      res.json({ success: true, message: successMsg });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetToken = await TokenModel.findValidResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
      }

      const newHash = await hashPassword(password);
      await UserModel.updatePassword(resetToken.user_id, newHash);
      await TokenModel.markResetTokenUsed(tokenHash);

      // Revoke all existing refresh tokens for security
      await TokenModel.revokeAllUserTokens(resetToken.user_id);

      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      res.json({ success: true, data: { user: sanitizeUser(user) } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/google/callback
   * Called after passport.authenticate('google') succeeds.
   */
  async googleCallback(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Google authentication failed.' });
      }

      const accessToken = await issueTokens(res, req.user);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/success?token=${accessToken}`);
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Strip sensitive fields before sending a user object to the client.
 */
function sanitizeUser(user) {
  const { password_hash, google_id, ...safe } = user;
  return safe;
}

module.exports = AuthController;
