import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import { getMyOrders } from '../../services/orders.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

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

  const rows = orders.map((order) => ({
    id: order.id,
    cells: [
      <span className="font-mono text-sm font-medium">{order.order_number}</span>,
      <span>{order.package?.[`name_${lang}`] || order.package?.name_es || '-'}</span>,
      <span className="font-semibold">{formatCurrency(order.total_amount, order.currency)}</span>,
      <Badge status={order.status} />,
      <span className="text-gray-500">{formatDate(order.created_at)}</span>,
    ],
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-dark mb-8">
        {t('myOrders.title')}
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-6">{t('myOrders.noOrders')}</p>
          <Link to="/packages">
            <Button variant="secondary">{t('myOrders.browseCatalog')}</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
