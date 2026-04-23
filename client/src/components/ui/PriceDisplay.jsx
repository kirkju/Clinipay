import { useTranslation } from 'react-i18next';
import { formatCurrency, computePackagePricing } from '../../utils/constants';

/**
 * Renders a package price with optional discount badge + struck-through original.
 *
 * Variants:
 *  - "hero"    — large price used in catalog/detail gradient headers (white text)
 *  - "default" — inline price for lists, cart items, tables
 *  - "compact" — small price for admin tables
 */
export default function PriceDisplay({ pkg, variant = 'default', className = '' }) {
  const { t } = useTranslation();
  const { unit, net, percentage, hasDiscount } = computePackagePricing(pkg);
  const currency = pkg?.currency || 'USD';

  if (variant === 'hero') {
    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
        {hasDiscount && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-error-500 text-white text-xs sm:text-sm font-bold shadow-md uppercase tracking-wide">
            {t('pricing.off', { percent: Math.round(percentage) })}
          </span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-white">
            {formatCurrency(net, currency)}
          </span>
          {hasDiscount && (
            <span className="text-base sm:text-lg text-white/70 line-through font-medium">
              {formatCurrency(unit, currency)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-semibold text-slate-800">{formatCurrency(net, currency)}</span>
        {hasDiscount && (
          <>
            <span className="text-xs text-slate-400 line-through">{formatCurrency(unit, currency)}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-error-100 text-error-700 text-[10px] font-bold">
              -{Math.round(percentage)}%
            </span>
          </>
        )}
      </div>
    );
  }

  // default
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className="text-lg font-bold text-mint-600">{formatCurrency(net, currency)}</span>
      {hasDiscount && (
        <>
          <span className="text-sm text-slate-400 line-through">{formatCurrency(unit, currency)}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-500 text-white text-[11px] font-bold uppercase tracking-wide">
            -{Math.round(percentage)}%
          </span>
        </>
      )}
    </div>
  );
}
