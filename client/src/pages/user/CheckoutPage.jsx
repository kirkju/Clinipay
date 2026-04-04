import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, CreditCard, AlertTriangle, ArrowLeft, ChevronDown } from 'lucide-react';
import { getPackageById } from '../../services/packages.service';
import { createOrder, simulatePayment } from '../../services/orders.service';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/constants';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-500 text-lg font-body">{t('checkout.packageNotFound')}</p>
      </div>
    );
  }

  const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Link
        to={`/packages/${packageId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      <h1 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 mb-8">
        {t('checkout.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Mobile: Collapsible summary */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileDetailOpen(!mobileDetailOpen)}
            className="w-full bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="text-sm text-slate-500 font-body">{pkg[`name_${lang}`] || pkg.name_es}</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(pkg.price, pkg.currency)}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${mobileDetailOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileDetailOpen && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-4 animate-fade-in-down">
              <ul className="space-y-2">
                {includes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-mint-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Left: Form area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Package Summary - desktop only */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-card p-6">
            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
              {t('checkout.packageSummary')}
            </h2>
            <h3 className="font-display text-base font-medium text-slate-700 mb-2">
              {pkg[`name_${lang}`] || pkg.name_es}
            </h3>
            <p className="text-slate-500 text-sm mb-4 font-body">
              {pkg[`description_${lang}`] || pkg.description_es}
            </p>
            <ul className="space-y-2">
              {includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-mint-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buyer Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
              {t('checkout.buyerInfo')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('checkout.name')}
                </label>
                <p className="text-slate-800 font-medium text-sm">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('checkout.email')}
                </label>
                <p className="text-slate-800 font-medium text-sm">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    {t('checkout.phone')}
                  </label>
                  <p className="text-slate-800 font-medium text-sm">{user.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Price & Pay - sticky on desktop */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-6">
              <span className="text-base font-medium text-slate-500 font-body">
                {t('checkout.total')}
              </span>
              <span className="text-3xl font-bold text-slate-800">
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

      {/* Mobile: Sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-elevated">
        <Button
          onClick={handleProceedToPayment}
          loading={processing}
          className="w-full gap-2"
          size="lg"
        >
          <CreditCard className="w-5 h-5" />
          {t('checkout.proceedPayment')} {formatCurrency(pkg.price, pkg.currency)}
        </Button>
      </div>

      {/* Payment Simulation Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !processing && setShowPaymentModal(false)}
        title={t('paymentModal.title')}
        size="md"
      >
        <div className="py-4">
          <div className="flex items-start gap-3 bg-warning-50 border border-warning-100 rounded-xl p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700 font-body">{t('paymentModal.message')}</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-slate-500 mb-1 font-body">{t('paymentModal.amount')}</p>
            <p className="text-4xl font-bold text-slate-800 font-display">
              {formatCurrency(pkg.price, pkg.currency)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleSimulatePayment(true)}
              loading={processing}
              className="w-full sm:flex-1"
              size="lg"
            >
              {t('paymentModal.simulateSuccess')}
            </Button>
            <Button
              onClick={() => handleSimulatePayment(false)}
              loading={processing}
              variant="danger"
              className="w-full sm:flex-1"
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
