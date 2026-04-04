import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function PaymentResultPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const isSuccess = status === 'success';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 sm:p-10">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-800 mb-3">
                {t('paymentResult.successTitle')}
              </h1>
              <p className="text-slate-500 text-sm mb-6 font-body">{t('paymentResult.successMessage')}</p>
              {orderId && (
                <p className="text-sm text-slate-500 mb-8 font-body">
                  {t('paymentResult.orderNumber')}:{' '}
                  <span className="font-mono font-semibold text-slate-800">{orderId}</span>
                </p>
              )}
              <div className="flex flex-col gap-3">
                {orderId && (
                  <Link to={`/my-orders/${orderId}`}>
                    <Button className="w-full">{t('paymentResult.viewOrder')}</Button>
                  </Link>
                )}
                <Link to="/">
                  <Button variant="secondary" className="w-full">
                    {t('paymentResult.goHome')}
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-error-50 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-error-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-800 mb-3">
                {t('paymentResult.failureTitle')}
              </h1>
              <p className="text-slate-500 text-sm mb-8 font-body">{t('paymentResult.failureMessage')}</p>
              <div className="flex flex-col gap-3">
                <Link to="/packages">
                  <Button className="w-full">{t('paymentResult.tryAgain')}</Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="w-full">
                    {t('paymentResult.goHome')}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
