import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Clock } from 'lucide-react';
import { getOrderById } from '../../services/orders.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import SEOHead from '../../components/seo/SEOHead';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    try {
      const data = await getOrderById(id);
      setOrder(data.order || data);
      setStatusHistory(data.statusHistory || []);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-500 text-lg mb-6 font-body">{t('orderDetail.notFound')}</p>
        <Link to="/my-orders">
          <Button variant="secondary">{t('orderDetail.backToOrders')}</Button>
        </Link>
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <SEOHead title="Detalle de Orden — CLINIPAY" path={`/my-orders/${id}`} noIndex />
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-8 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('orderDetail.backToOrders')}
      </Link>

      <h1 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] font-bold text-slate-800 mb-8">
        {t('orderDetail.title')}
      </h1>

      {/* Order header info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden mb-6">
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                {t('orderDetail.orderNumber')}
              </label>
              <p className="font-mono text-lg font-semibold text-slate-800">
                {order.order_number}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                {t('orderDetail.status')}
              </label>
              <Badge status={order.status} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                {t('orderDetail.amount')}
              </label>
              <p className="text-2xl font-bold text-mint-600">
                {formatCurrency(order.total_amount, order.currency)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                {t('orderDetail.createdAt')}
              </label>
              <p className="text-slate-700 text-sm">{formatDate(order.created_at)}</p>
            </div>
            {order.payment_reference && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('orderDetail.paymentRef')}
                </label>
                <p className="font-mono text-sm text-slate-700">{order.payment_reference}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order items with patient info */}
      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          <h2 className="font-display text-lg font-semibold text-slate-800">
            {t('orderDetail.items')} ({items.length})
          </h2>
          {items.map((item, idx) => (
            <div key={item.id || idx} className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-slate-800">
                    {item[`package_name_${lang}`] || item.package_name_es}
                  </h3>
                  <p className="text-lg font-bold text-mint-600 mt-0.5">
                    {formatCurrency(item.unit_price, item.currency)}
                  </p>
                </div>
              </div>

              {/* Patient info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {t('patient.title')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('patient.fullName')}
                    </label>
                    <p className="text-sm text-slate-700">{item.patient_first_name} {item.patient_last_name}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('patient.phone')}
                    </label>
                    <p className="text-sm text-slate-700">{item.patient_phone}</p>
                  </div>
                  {item.patient_birth_date && (
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                        {t('patient.birthDate')}
                      </label>
                      <p className="text-sm text-slate-700">{formatDate(item.patient_birth_date).split(',')[0]}</p>
                    </div>
                  )}
                  {item.patient_id_number && (
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                        {t('patient.idNumber')}
                      </label>
                      <p className="text-sm text-slate-700">{item.patient_id_number}</p>
                    </div>
                  )}
                  {item.patient_email && (
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                        {t('patient.email')}
                      </label>
                      <p className="text-sm text-slate-700">{item.patient_email}</p>
                    </div>
                  )}
                  {item.patient_relationship && item.patient_relationship !== 'self' && (
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                        {t('patient.relationship')}
                      </label>
                      <p className="text-sm text-slate-700">{t(`patient.relationships.${item.patient_relationship}`)}</p>
                    </div>
                  )}
                  {item.patient_notes && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                        {t('patient.notes')}
                      </label>
                      <p className="text-sm text-slate-700">{item.patient_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
          <h3 className="font-display text-base sm:text-lg font-semibold text-slate-800 mb-4">
            {t('admin.orderDetail.statusHistory')}
          </h3>
          <div className="space-y-4">
            {statusHistory.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-mint-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-mint-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge status={entry.new_status || entry.status} />
                    <span className="text-xs text-slate-400">
                      {formatDate(entry.changed_at || entry.created_at)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-slate-600 font-body">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
