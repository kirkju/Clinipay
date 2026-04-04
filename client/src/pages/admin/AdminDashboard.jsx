import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Clock, DollarSign, Users } from 'lucide-react';
import { getDashboard } from '../../services/admin.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-text-dark">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const result = await getDashboard();
      setData(result);
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

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];

  const headers = [
    t('admin.orders.orderNumber'),
    t('admin.orders.client'),
    t('admin.orders.package'),
    t('admin.orders.amount'),
    t('admin.orders.status'),
    t('admin.orders.date'),
  ];

  const rows = recentOrders.map((order) => ({
    id: order.id,
    cells: [
      <span className="font-mono text-sm font-medium">{order.order_number}</span>,
      <span>{order.user?.first_name} {order.user?.last_name}</span>,
      <span>{order.package?.[`name_${lang}`] || order.package?.name_es || '-'}</span>,
      <span className="font-semibold">{formatCurrency(order.total_amount, order.currency)}</span>,
      <Badge status={order.status} />,
      <span className="text-gray-500 text-sm">{formatDate(order.created_at)}</span>,
    ],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-dark mb-6">
        {t('admin.dashboard.title')}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={ShoppingBag}
          label={t('admin.dashboard.totalOrders')}
          value={stats.totalOrders ?? 0}
          color="bg-primary"
        />
        <StatCard
          icon={Clock}
          label={t('admin.dashboard.pendingOrders')}
          value={stats.pendingOrders ?? 0}
          color="bg-warning"
        />
        <StatCard
          icon={DollarSign}
          label={t('admin.dashboard.totalRevenue')}
          value={formatCurrency(stats.totalRevenue ?? 0)}
          color="bg-success"
        />
        <StatCard
          icon={Users}
          label={t('admin.dashboard.registeredUsers')}
          value={stats.registeredUsers ?? 0}
          color="bg-blue-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-dark">
            {t('admin.dashboard.recentOrders')}
          </h2>
        </div>
        <Table
          headers={headers}
          rows={rows}
          onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
          emptyMessage={t('admin.orders.noOrders')}
        />
      </div>
    </div>
  );
}
