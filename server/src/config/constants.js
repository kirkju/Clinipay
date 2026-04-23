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

// Honduras ISV — applied on subtotal after discount.
const TAX_RATE = 0.15;

// Age-based discounts (senior / fourth-age). Only applied to packages where
// senior_discount_enabled = 1. The higher of (package %, age %) wins — not stacked.
const AGE_DISCOUNTS = {
  SENIOR_MIN_AGE: 60,
  FOURTH_AGE_MIN_AGE: 80,
  SENIOR_PERCENTAGE: 25,
  FOURTH_AGE_PERCENTAGE: 30,
};

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function getAgeYears(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null;
  const bd = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  let age = referenceDate.getFullYear() - bd.getFullYear();
  const m = referenceDate.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < bd.getDate())) age--;
  return age;
}

function getAgeDiscount(birthDate) {
  const age = getAgeYears(birthDate);
  if (age == null) return { percentage: 0, tier: null };
  if (age >= AGE_DISCOUNTS.FOURTH_AGE_MIN_AGE) {
    return { percentage: AGE_DISCOUNTS.FOURTH_AGE_PERCENTAGE, tier: 'fourth_age' };
  }
  if (age >= AGE_DISCOUNTS.SENIOR_MIN_AGE) {
    return { percentage: AGE_DISCOUNTS.SENIOR_PERCENTAGE, tier: 'senior' };
  }
  return { percentage: 0, tier: null };
}

function effectiveDiscountPct(pkg, birthDate) {
  const base = Number(pkg?.discount_percentage) || 0;
  if (!pkg?.senior_discount_enabled) return { percentage: base, tier: base > 0 ? 'package' : null };
  const age = getAgeDiscount(birthDate);
  return age.percentage > base
    ? { percentage: age.percentage, tier: age.tier }
    : { percentage: base, tier: base > 0 ? 'package' : null };
}

function computeLineAmounts(unitPrice, discountPercentage) {
  const price = Number(unitPrice) || 0;
  const pct = Math.min(Math.max(Number(discountPercentage) || 0, 0), 100);
  const discount = round2(price * (pct / 100));
  const net = round2(price - discount);
  return { unit: round2(price), discount, net, percentage: pct };
}

module.exports = {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  ROLES,
  PASSWORD_REGEX,
  TAX_RATE,
  AGE_DISCOUNTS,
  round2,
  computeLineAmounts,
  getAgeYears,
  getAgeDiscount,
  effectiveDiscountPct,
};
