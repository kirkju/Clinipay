const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserModel = require('../models/user.model');

function configureGoogleStrategy() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[Passport] Google OAuth credentials not configured; skipping Google strategy.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // 1. Try to find by google_id
          let user = await UserModel.findByGoogleId(googleId);
          if (user) {
            return done(null, user);
          }

          // 2. Try to find by email (user may have registered with local provider)
          user = await UserModel.findByEmail(email);
          if (user) {
            // Link Google account to existing user
            await UserModel.linkGoogleAccount(user.id, googleId);
            user = await UserModel.findById(user.id);
            return done(null, user);
          }

          // 3. Create new user
          const newUser = await UserModel.create({
            email,
            password_hash: null,
            first_name: profile.name?.givenName || 'User',
            last_name: profile.name?.familyName || '',
            phone: null,
            role: 'client',
            auth_provider: 'google',
            google_id: googleId,
            preferred_language: 'es',
          });

          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = { passport, configureGoogleStrategy };
