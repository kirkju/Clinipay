const { body, validationResult } = require('express-validator');
const { PASSWORD_REGEX } = require('../config/constants');

/**
 * Middleware that checks express-validator results and short-circuits with 400
 * if there are validation errors.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must contain at least one uppercase letter and one number.'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters.'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('preferred_language')
    .optional()
    .isIn(['es', 'en'])
    .withMessage('Preferred language must be "es" or "en".'),
  validate,
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  validate,
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  validate,
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must contain at least one uppercase letter and one number.'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
};
