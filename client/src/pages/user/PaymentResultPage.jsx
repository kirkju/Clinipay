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
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-text-dark mb-3">
                {t('paymentResult.successTitle')}
              </h1>
              <p className="text-gray-500 mb-6">{t('paymentResult.successMessage')}</p>
              {orderId && (
                <p className="text-sm text-gray-500 mb-8">
                  {t('paymentResult.orderNumber')}:{' '}
                  <span className="font-mono font-semibold text-text-dark">{orderId}</span>
                </p>
              )}
              <div className="space-y-3">
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-error" />
              </div>
              <h1 className="text-2xl font-bold text-text-dark mb-3">
                {t('paymentResult.failureTitle')}
              </h1>
              <p className="text-gray-500 mb-8">{t('paymentResult.failureMessage')}</p>
              <div className="space-y-3">
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
