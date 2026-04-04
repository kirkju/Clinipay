import { useTranslation } from 'react-i18next';

const colorMap = {
  pending_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Badge({ status, className = '' }) {
  const { t } = useTranslation();

  const colors = colorMap[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}
    >
      {t(`statuses.${status}`, status)}
    </span>
  );
}
