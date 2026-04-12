import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { getOrderDetail, updateOrderStatus } from '../../services/admin.service';
import { formatCurrency, formatDate, VALID_TRANSITIONS } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import SEOHead from '../../components/seo/SEOHead';

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
        <p className="text-slate-500 text-lg font-body">{t('orderDetail.notFound')}</p>
      </div>
    );
  }

  const validTransitions = VALID_TRANSITIONS[order.status] || [];
  const statusHistory = order.status_history || [];
  const items = order.items || [];

  return (
    <div>
      <SEOHead title="Admin — CLINIPAY" path={`/admin/orders/${id}`} noIndex />
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6">
        {t('admin.orderDetail.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('orderDetail.orderNumber')}
                </label>
                <p className="font-mono text-lg font-semibold text-slate-800">{order.order_number}</p>
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
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    {t('orderDetail.paymentRef')}
                  </label>
                  <p className="font-mono text-sm text-slate-700">{order.payment_reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
            <h3 className="font-display text-base sm:text-lg font-semibold text-slate-800 mb-4">
              {t('admin.orderDetail.clientInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('checkout.name')}
                </label>
                <p className="text-slate-700 text-sm">
                  {order.user_first_name} {order.user_last_name}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t('checkout.email')}
                </label>
                <p className="text-slate-700 text-sm">{order.user_email}</p>
              </div>
              {order.user_phone && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    {t('checkout.phone')}
                  </label>
                  <p className="text-slate-700 text-sm">{order.user_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items with Patient Info */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display text-base sm:text-lg font-semibold text-slate-800">
                {t('orderDetail.items')} ({items.length})
              </h3>
              {items.map((item, idx) => (
                <div key={item.id || idx} className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-display font-semibold text-slate-800">
                        {item[`package_name_${lang}`] || item.package_name_es}
                      </h4>
                      <p className="text-lg font-bold text-mint-600 mt-0.5">
                        {formatCurrency(item.unit_price, item.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Patient info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {t('patient.title')}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                          {t('patient.fullName')}
                        </label>
                        <p className="text-sm font-medium text-slate-700">{item.patient_first_name} {item.patient_last_name}</p>
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
                      {item.patient_relationship && (
                        <div>
                          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                            {t('patient.relationship')}
                          </label>
                          <p className="text-sm text-slate-700">{t(`patient.relationships.${item.patient_relationship}`)}</p>
                        </div>
                      )}
                      {item.patient_notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
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
                      {(entry.changed_by_first_name || entry.changed_by_name) && (
                        <p className="text-xs text-slate-400 mt-1">
                          {entry.changed_by_first_name ? `${entry.changed_by_first_name} ${entry.changed_by_last_name || ''}` : entry.changed_by_name}
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-base sm:text-lg font-semibold text-slate-800 mb-4">
              {t('admin.orderDetail.updateStatus')}
            </h3>

            {validTransitions.length === 0 ? (
              <p className="text-sm text-slate-500 font-body">{t('common.noResults')}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('admin.orderDetail.newStatus')}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none cursor-pointer transition-all duration-200 bg-white text-slate-800"
                  >
                    <option value="">--</option>
                    {validTransitions.map((s) => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('admin.orderDetail.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('admin.orderDetail.notesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none resize-y min-h-[80px] transition-all duration-200 bg-white text-slate-800 placeholder:text-slate-400"
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
