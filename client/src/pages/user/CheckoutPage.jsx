import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, AlertTriangle, ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';
import { createOrder, simulatePayment } from '../../services/orders.service';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, computePackagePricing, computeCartTotals } from '../../utils/constants';
import PatientForm from '../../components/checkout/PatientForm';
import Button from '../../components/ui/Button';
import PriceDisplay from '../../components/ui/PriceDisplay';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import SEOHead from '../../components/seo/SEOHead';
import { trackEvent } from '../../hooks/usePageTracking';

const EMPTY_PATIENT = {
  patient_first_name: '',
  patient_last_name: '',
  patient_id_number: '',
  patient_phone: '',
  patient_email: '',
  patient_birth_date: '',
  patient_relationship: 'self',
  patient_notes: '',
};

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [patientForms, setPatientForms] = useState([]);
  const [formErrors, setFormErrors] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const birthDates = patientForms.map((f) => f?.patient_birth_date || null);
  const { subtotal: cartSubtotal, discount: cartDiscount, tax: cartTax, total: cartTotal } =
    useMemo(() => computeCartTotals(cartItems, birthDates), [cartItems, birthDates.join('|')]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    // Initialize one patient form per cart item
    setPatientForms(cartItems.map(() => ({ ...EMPTY_PATIENT })));
    setFormErrors(cartItems.map(() => ({})));
  }, []);

  function handlePatientChange(index, data) {
    setPatientForms((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });
    // Clear errors for that index
    setFormErrors((prev) => {
      const next = [...prev];
      next[index] = {};
      return next;
    });
  }

  function validateForms() {
    const errors = patientForms.map((form) => {
      const e = {};
      if (!form.patient_first_name.trim()) e.patient_first_name = t('errors.firstNameRequired');
      if (!form.patient_last_name.trim()) e.patient_last_name = t('errors.lastNameRequired');
      if (!form.patient_phone.trim()) e.patient_phone = t('patient.phoneRequired');
      if (!form.patient_birth_date) e.patient_birth_date = t('patient.birthDateRequired');
      if (form.patient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patient_email)) {
        e.patient_email = t('errors.invalidEmail');
      }
      return e;
    });
    setFormErrors(errors);
    return errors.every((e) => Object.keys(e).length === 0);
  }

  async function handleProceedToPayment() {
    if (!validateForms()) {
      toast.error(t('errors.validation'));
      return;
    }

    try {
      setProcessing(true);

      // Build items payload
      const items = cartItems.map((cartItem, idx) => ({
        package_id: cartItem.packageId,
        ...patientForms[idx],
      }));

      const data = await createOrder(items);
      const newOrderId = data.order?.id || data.id;
      setOrderId(newOrderId);
      trackEvent('begin_checkout', { items: cartItems.length, value: cartTotal });
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
      clearCart();
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

  if (cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currency = cartItems[0]?.snapshot.currency || 'USD';

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <SEOHead title={`${t('checkout.title')} — CLINIPAY`} path="/checkout" noIndex />

      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('cart.backToCart')}
      </Link>

      <h1 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 mb-8">
        {t('checkout.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left: Items + Patient forms */}
        <div className="lg:col-span-3 space-y-6">
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
            </div>
          </div>

          {/* Order items summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
              {t('checkout.orderItems')} ({cartItems.length})
            </h2>
            <div className="space-y-3">
              {cartItems.map((item, idx) => {
                const pricing = computePackagePricing(item.snapshot, birthDates[idx]);
                const { net, unit, percentage, tier, hasDiscount } = pricing;
                const itemCurrency = item.snapshot.currency;
                const tierLabel =
                  tier === 'senior' ? t('pricing.seniorTier')
                  : tier === 'fourth_age' ? t('pricing.fourthAgeTier')
                  : null;
                return (
                  <div key={item.lineId} className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle className="w-4 h-4 text-mint-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">
                          {item.snapshot[`name_${lang}`] || item.snapshot.name_es}
                        </span>
                        {hasDiscount && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-error-500 text-white text-[10px] font-bold flex-shrink-0">
                            -{Math.round(percentage)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 flex-shrink-0">
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(unit, itemCurrency)}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-slate-800">
                          {formatCurrency(net, itemCurrency)}
                        </span>
                      </div>
                    </div>
                    {tierLabel && (
                      <p className="text-[11px] text-mint-600 font-semibold pl-6">
                        {t('pricing.ageDiscountApplied')} · {tierLabel}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient forms — one per item */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-800">
              {t('patient.sectionTitle')}
            </h2>
            <p className="text-sm text-slate-500 font-body -mt-2">
              {t('patient.sectionDesc')}
            </p>
            {cartItems.map((item, idx) => (
              <div key={item.lineId}>
                <p className="text-sm font-medium text-mint-600 mb-2">
                  {item.snapshot[`name_${lang}`] || item.snapshot.name_es}
                </p>
                <PatientForm
                  index={idx}
                  data={patientForms[idx] || EMPTY_PATIENT}
                  onChange={handlePatientChange}
                  errors={formErrors[idx] || {}}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Total + Pay - sticky */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-semibold text-slate-800 mb-4">
              {t('cart.summary')}
            </h3>
            <div className="space-y-3 mb-6">
              {cartItems.map((item, idx) => {
                const { net } = computePackagePricing(item.snapshot, birthDates[idx]);
                return (
                  <div key={item.lineId} className="flex justify-between text-sm text-slate-600">
                    <span className="truncate pr-2">{item.snapshot[`name_${lang}`] || item.snapshot.name_es}</span>
                    <span className="flex-shrink-0">{formatCurrency(net, item.snapshot.currency)}</span>
                  </div>
                );
              })}
              <hr className="border-slate-100" />
              <div className="flex justify-between text-sm text-slate-600">
                <span>{t('cart.subtotal')}</span>
                <span>{formatCurrency(cartSubtotal, currency)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-error-600">
                  <span>{t('cart.discount')}</span>
                  <span>−{formatCurrency(cartDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>{t('cart.tax')}</span>
                <span>{formatCurrency(cartTax, currency)}</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-slate-500 font-body">
                  {t('checkout.total')}
                </span>
                <span className="text-3xl font-bold text-slate-800">
                  {formatCurrency(cartTotal, currency)}
                </span>
              </div>
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
          {t('checkout.proceedPayment')} {formatCurrency(cartTotal, currency)}
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
              {formatCurrency(cartTotal, currency)}
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
