import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock } from 'lucide-react';
import { getOrderDetail, updateOrderStatus } from '../../services/admin.service';
import { formatCurrency, formatDate, VALID_TRANSITIONS } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    try {
      const data = await getOrderDetail(id);
      setOrder(data.order || data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const data = await updateOrderStatus(id, newStatus, notes);
      setOrder(data.order || data);
      setNewStatus('');
      setNotes('');
      toast.success(t('success.statusUpdated'));
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setUpdating(false);
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
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">{t('orderDetail.notFound')}</p>
      </div>
    );
  }

  const validTransitions = VALID_TRANSITIONS[order.status] || [];
  const statusHistory = order.status_history || [];

  return (
    <div>
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-text-dark mb-6">
        {t('admin.orderDetail.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('orderDetail.orderNumber')}
                </label>
                <p className="font-mono text-lg font-semibold">{order.order_number}</p>
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
              {order.payment_reference && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('orderDetail.paymentRef')}
                  </label>
                  <p className="font-mono text-text-dark">{order.payment_reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-text-dark mb-4">
              {t('admin.orderDetail.clientInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('checkout.name')}
                </label>
                <p className="text-text-dark">
                  {order.user?.first_name} {order.user?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('checkout.email')}
                </label>
                <p className="text-text-dark">{order.user?.email}</p>
              </div>
              {order.user?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('checkout.phone')}
                  </label>
                  <p className="text-text-dark">{order.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-text-dark mb-4">
                {t('admin.orderDetail.statusHistory')}
              </h3>
              <div className="space-y-4">
                {statusHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge status={entry.status} />
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.changed_at || entry.created_at)}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600">{entry.notes}</p>
                      )}
                      {entry.changed_by_name && (
                        <p className="text-xs text-gray-400 mt-1">
                          {entry.changed_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Update Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-text-dark mb-4">
              {t('admin.orderDetail.updateStatus')}
            </h3>

            {validTransitions.length === 0 ? (
              <p className="text-sm text-gray-500">{t('common.noResults')}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">
                    {t('admin.orderDetail.newStatus')}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="">--</option>
                    {validTransitions.map((s) => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">
                    {t('admin.orderDetail.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('admin.orderDetail.notesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
                  />
                </div>

                <Button
                  onClick={handleUpdateStatus}
                  loading={updating}
                  disabled={!newStatus}
                  className="w-full"
                >
                  {t('admin.orderDetail.saveChanges')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
