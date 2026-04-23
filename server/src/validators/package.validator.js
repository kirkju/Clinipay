const { body } = require('express-validator');
const { validate } = require('./auth.validator');

const createPackageValidation = [
  body('name_es')
    .trim()
    .notEmpty()
    .withMessage('name_es is required.')
    .isLength({ max: 200 })
    .withMessage('name_es must not exceed 200 characters.'),
  body('name_en')
    .trim()
    .notEmpty()
    .withMessage('name_en is required.')
    .isLength({ max: 200 })
    .withMessage('name_en must not exceed 200 characters.'),
  body('description_es')
    .trim()
    .notEmpty()
    .withMessage('description_es is required.'),
  body('description_en')
    .trim()
    .notEmpty()
    .withMessage('description_en is required.'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('price must be a positive number.'),
  body('currency')
    .optional()
    .isIn(['USD', 'CRC'])
    .withMessage('currency must be USD or CRC.'),
  body('includes_es')
    .optional({ nullable: true }),
  body('includes_en')
    .optional({ nullable: true }),
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('display_order must be a non-negative integer.'),
  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('discount_percentage must be between 0 and 100.'),
  body('senior_discount_enabled')
    .optional()
    .isBoolean()
    .withMessage('senior_discount_enabled must be boolean.'),
  validate,
];

const updatePackageValidation = [
  body('name_es')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('name_es must not exceed 200 characters.'),
  body('name_en')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('name_en must not exceed 200 characters.'),
  body('description_es')
    .optional()
    .trim(),
  body('description_en')
    .optional()
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('price must be a positive number.'),
  body('currency')
    .optional()
    .isIn(['USD', 'CRC'])
    .withMessage('currency must be USD or CRC.'),
  body('includes_es')
    .optional({ nullable: true }),
  body('includes_en')
    .optional({ nullable: true }),
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('display_order must be a non-negative integer.'),
  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('discount_percentage must be between 0 and 100.'),
  body('senior_discount_enabled')
    .optional()
    .isBoolean()
    .withMessage('senior_discount_enabled must be boolean.'),
  validate,
];

module.exports = {
  createPackageValidation,
  updatePackageValidation,
};
