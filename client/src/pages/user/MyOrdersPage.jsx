import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Package } from 'lucide-react';
import { getMyOrders } from '../../services/orders.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/seo/SEOHead';

export default function MyOrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const data = await getMyOrders();
      setOrders(data.orders || data);
    } catch {
      // handled by interceptor
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

  const headers = [
    t('myOrders.orderNumber'),
    t('myOrders.package'),
    t('myOrders.amount'),
    t('myOrders.status'),
    t('myOrders.date'),
  ];

  const rows = orders.map((order) => {
    const pkgName = order[`first_package_name_${lang}`] || order.first_package_name_es || '-';
    const label = order.item_count > 1 ? `${pkgName} +${order.item_count - 1}` : pkgName;
    return {
      id: order.id,
      cells: [
        <span className="font-mono text-sm font-medium text-slate-800">{order.order_number}</span>,
        <span className="text-slate-700">{label}</span>,
        <span className="font-semibold text-slate-800">{formatCurrency(order.total_amount, order.currency)}</span>,
        <Badge status={order.status} />,
        <span className="text-slate-500 text-sm">{formatDate(order.created_at)}</span>,
      ],
    };
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <SEOHead title="Mis Órdenes — CLINIPAY" path="/my-orders" noIndex />
      <h1 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 mb-8">
        {t('myOrders.title')}
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-700 mb-1.5">
            {t('myOrders.noOrders')}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6 font-body">
            {t('myOrders.noOrdersDesc', { defaultValue: '' })}
          </p>
          <Link to="/packages">
            <Button variant="secondary">{t('myOrders.browseCatalog')}</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <Table
            headers={headers}
            rows={rows}
            onRowClick={(row) => navigate(`/my-orders/${row.id}`)}
          />
        </div>
      )}
    </div>
  );
}
