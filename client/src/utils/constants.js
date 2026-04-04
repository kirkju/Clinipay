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
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString, locale = 'es-PA') {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
