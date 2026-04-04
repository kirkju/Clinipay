const { body } = require('express-validator');
const { validate } = require('./auth.validator');
const { ORDER_STATUSES } = require('../config/constants');

const validStatuses = Object.values(ORDER_STATUSES);

const createOrderValidation = [
  body('package_id')
    .notEmpty()
    .withMessage('package_id is required.')
    .isInt({ min: 1 })
    .withMessage('package_id must be a positive integer.'),
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
