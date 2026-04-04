import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { getOrderById } from '../../services/orders.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    try {
      const data = await getOrderById(id);
      setOrder(data.order || data);
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

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
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
                {t('orderDetail.package')}
              </label>
              <p className="text-slate-700 font-medium">
                {order.package?.[`name_${lang}`] || order.package?.name_es || '-'}
              </p>
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
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                {t('orderDetail.updatedAt')}
              </label>
              <p className="text-slate-700 text-sm">{formatDate(order.updated_at)}</p>
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
    </div>
  );
}
