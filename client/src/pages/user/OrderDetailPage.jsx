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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-6">{t('orderDetail.notFound')}</p>
        <Link to="/my-orders">
          <Button variant="secondary">{t('orderDetail.backToOrders')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('orderDetail.backToOrders')}
      </Link>

      <h1 className="text-3xl font-bold text-text-dark mb-8">
        {t('orderDetail.title')}
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.orderNumber')}
              </label>
              <p className="font-mono text-lg font-semibold text-text-dark">
                {order.order_number}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.status')}
              </label>
              <Badge status={order.status} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.package')}
              </label>
              <p className="text-text-dark font-medium">
                {order.package?.[`name_${lang}`] || order.package?.name_es || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.amount')}
              </label>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(order.total_amount, order.currency)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.createdAt')}
              </label>
              <p className="text-text-dark">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('orderDetail.updatedAt')}
              </label>
              <p className="text-text-dark">{formatDate(order.updated_at)}</p>
            </div>
            {order.payment_reference && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('orderDetail.paymentRef')}
                </label>
                <p className="font-mono text-text-dark">{order.payment_reference}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
