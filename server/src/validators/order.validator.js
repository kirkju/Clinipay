const { body } = require('express-validator');
const { validate } = require('./auth.validator');
const { ORDER_STATUSES } = require('../config/constants');

const validStatuses = Object.values(ORDER_STATUSES);

const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array.'),

  body('items.*.package_id')
    .notEmpty().withMessage('package_id is required.')
    .isInt({ min: 1 }).withMessage('package_id must be a positive integer.'),

  body('items.*.patient_first_name')
    .trim().notEmpty().withMessage('Patient first name is required.')
    .isLength({ max: 100 }).withMessage('Patient first name must not exceed 100 characters.'),

  body('items.*.patient_last_name')
    .trim().notEmpty().withMessage('Patient last name is required.')
    .isLength({ max: 100 }).withMessage('Patient last name must not exceed 100 characters.'),

  body('items.*.patient_id_number')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Patient ID must not exceed 50 characters.'),

  body('items.*.patient_phone')
    .trim().notEmpty().withMessage('Patient phone is required.')
    .isLength({ max: 30 }).withMessage('Patient phone must not exceed 30 characters.'),

  body('items.*.patient_email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Patient email must be a valid email.'),

  body('items.*.patient_birth_date')
    .notEmpty().withMessage('Patient birth date is required.')
    .isISO8601().withMessage('Patient birth date must be a valid date (YYYY-MM-DD).'),

  body('items.*.patient_relationship')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['self', 'spouse', 'child', 'parent', 'sibling', 'other'])
    .withMessage('patient_relationship must be one of: self, spouse, child, parent, sibling, other.'),

  body('items.*.patient_notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Patient notes must not exceed 1000 characters.'),

  validate,
];

const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('status is required.')
    .isIn(validStatuses)
    .withMessage(`status must be one of: ${validStatuses.join(', ')}.`),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('notes must not exceed 500 characters.'),
  validate,
];

module.exports = {
  createOrderValidation,
  updateStatusValidation,
};
