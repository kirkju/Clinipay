/**
 * CLINIPAY application constants
 */

const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Valid status transitions map.
 * Key = current status, Value = array of statuses it can transition to.
 */
const VALID_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.PAID, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.IN_PROGRESS]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

const ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

/**
 * Minimum 8 characters, at least 1 uppercase letter, at least 1 number.
 */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

module.exports = {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  ROLES,
  PASSWORD_REGEX,
};
