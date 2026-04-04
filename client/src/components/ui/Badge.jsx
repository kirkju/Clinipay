import { useTranslation } from 'react-i18next';

const statusConfig = {
  pending_payment: { bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
  paid:            { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-500' },
  in_progress:     { bg: 'bg-info-100',    text: 'text-info-700',    dot: 'bg-info-500' },
  completed:       { bg: 'bg-mint-100',    text: 'text-forest-500',  dot: 'bg-mint-500' },
  cancelled:       { bg: 'bg-error-100',   text: 'text-error-700',   dot: 'bg-error-500' },
};

export default function Badge({ status, className = '' }) {
  const { t } = useTranslation();

  const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        text-xs font-semibold
        ${config.bg} ${config.text}
        transition-colors duration-200
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t(`statuses.${status}`, status)}
    </span>
  );
}
