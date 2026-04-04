import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, CreditCard, AlertTriangle } from 'lucide-react';
import { getPackageById } from '../../services/packages.service';
import { createOrder, simulatePayment } from '../../services/orders.service';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/constants';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { packageId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    fetchPackage();
  }, [packageId]);

  async function fetchPackage() {
    try {
      const data = await getPackageById(packageId);
      setPkg(data.package || data);
    } catch {
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToPayment() {
    try {
      setProcessing(true);
      const data = await createOrder(packageId);
      setOrderId(data.order?.id || data.id);
      toast.success(t('success.orderCreated'));
      setShowPaymentModal(true);
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSimulatePayment(success) {
    if (!orderId) return;
    setProcessing(true);
    try {
      await simulatePayment(orderId, success);
      setShowPaymentModal(false);
      if (success) {
        navigate(`/payment/result?status=success&orderId=${orderId}`);
      } else {
        navigate(`/payment/result?status=failure&orderId=${orderId}`);
      }
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{t('checkout.packageNotFound')}</p>
      </div>
    );
  }

  const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-8">
        {t('checkout.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Package Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-text-dark mb-4">
              {t('checkout.packageSummary')}
            </h2>
            <h3 className="text-lg font-medium text-text-dark mb-2">
              {pkg[`name_${lang}`] || pkg.name_es}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {pkg[`description_${lang}`] || pkg.description_es}
            </p>

            <h4 className="text-sm font-semibold text-text-dark mb-2">
              {t('checkout.includes')}
            </h4>
            <ul className="space-y-2 mb-4">
              {includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buyer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-text-dark mb-4">
              {t('checkout.buyerInfo')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('checkout.name')}
                </label>
                <p className="text-text-dark font-medium">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('checkout.email')}
                </label>
                <p className="text-text-dark font-medium">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('checkout.phone')}
                  </label>
                  <p className="text-text-dark font-medium">{user.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total & Pay */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-medium text-gray-500">
                {t('checkout.total')}
              </span>
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(pkg.price, pkg.currency)}
              </span>
            </div>
            <Button
              onClick={handleProceedToPayment}
              loading={processing}
              className="w-full gap-2"
              size="lg"
            >
              <CreditCard className="w-5 h-5" />
              {t('checkout.proceedPayment')}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Simulation Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !processing && setShowPaymentModal(false)}
        title={t('paymentModal.title')}
        size="md"
      >
        <div className="py-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{t('paymentModal.message')}</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-1">{t('paymentModal.amount')}</p>
            <p className="text-4xl font-bold text-text-dark">
              {formatCurrency(pkg.price, pkg.currency)}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleSimulatePayment(true)}
              loading={processing}
              className="w-full"
              size="lg"
            >
              {t('paymentModal.simulateSuccess')}
            </Button>
            <Button
              onClick={() => handleSimulatePayment(false)}
              loading={processing}
              variant="danger"
              className="w-full"
              size="lg"
            >
              {t('paymentModal.simulateFailure')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
