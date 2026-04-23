export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'in_progress',
  'completed',
  'cancelled',
];

export const STATUS_COLORS = {
  pending_payment: 'warning',
  paid: 'blue',
  in_progress: 'purple',
  completed: 'success',
  cancelled: 'error',
};

export const VALID_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Honduras ISV — applied on subtotal after discount.
export const TAX_RATE = 0.15;

// Age-based discounts (applied only to packages with senior_discount_enabled).
// Higher of (package %, age %) wins — not stacked.
export const AGE_DISCOUNTS = {
  SENIOR_MIN_AGE: 60,
  FOURTH_AGE_MIN_AGE: 80,
  SENIOR_PERCENTAGE: 25,
  FOURTH_AGE_PERCENTAGE: 30,
};

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function getAgeYears(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null;
  const bd = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  let age = referenceDate.getFullYear() - bd.getFullYear();
  const m = referenceDate.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < bd.getDate())) age--;
  return age;
}

export function getAgeDiscount(birthDate) {
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

export function effectiveDiscount(pkg, birthDate) {
  const base = Number(pkg?.discount_percentage) || 0;
  if (!pkg?.senior_discount_enabled) {
    return { percentage: base, tier: base > 0 ? 'package' : null };
  }
  const age = getAgeDiscount(birthDate);
  return age.percentage > base
    ? { percentage: age.percentage, tier: age.tier }
    : { percentage: base, tier: base > 0 ? 'package' : null };
}

export function computePackagePricing(pkg, birthDate) {
  const unit = Number(pkg?.price) || 0;
  const { percentage, tier } = effectiveDiscount(pkg, birthDate);
  const pct = Math.min(Math.max(percentage, 0), 100);
  const discount = round2(unit * (pct / 100));
  const net = round2(unit - discount);
  return {
    unit: round2(unit),
    discount,
    net,
    percentage: pct,
    tier,
    hasDiscount: pct > 0 && discount > 0,
  };
}

export function computeCartTotals(items, patientBirthDates = []) {
  let subtotal = 0;
  let discount = 0;
  items.forEach((item, idx) => {
    const pkg = item.snapshot || item;
    const bd = patientBirthDates[idx];
    const { unit, discount: d } = computePackagePricing(pkg, bd);
    subtotal += unit;
    discount += d;
  });
  subtotal = round2(subtotal);
  discount = round2(discount);
  const net = round2(subtotal - discount);
  const tax = round2(net * TAX_RATE);
  const total = round2(net + tax);
  return { subtotal, discount, net, tax, total };
}

export function formatDate(dateString, locale = 'es-HN') {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
