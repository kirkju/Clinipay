const { Router } = require('express');
const passport = require('passport');
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/auth.validator');

const router = Router();

// Public routes
router.post('/register', registerLimiter, registerValidation, AuthController.register);
router.post('/login', loginLimiter, loginValidation, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, AuthController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  AuthController.googleCallback
);
router.get('/google/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/google/failure`);
});

// Protected routes
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);
router.delete('/me', verifyToken, AuthController.deleteAccount);

module.exports = router;
