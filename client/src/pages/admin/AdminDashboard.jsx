import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Clock, DollarSign, Users } from 'lucide-react';
import { getDashboard } from '../../services/admin.service';
import { formatCurrency, formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

function StatCard({ icon: Icon, label, value, bgColor, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-slate-500 font-body">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 font-display">{value}</p>
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
      <span className="font-mono text-sm font-medium text-slate-800">{order.order_number}</span>,
      <span className="text-slate-700">{order.user?.first_name} {order.user?.last_name}</span>,
      <span className="text-slate-600">{order.package?.[`name_${lang}`] || order.package?.name_es || '-'}</span>,
      <span className="font-semibold text-slate-800">{formatCurrency(order.total_amount, order.currency)}</span>,
      <Badge status={order.status} />,
      <span className="text-slate-500 text-sm">{formatDate(order.created_at)}</span>,
    ],
  }));

  return (
    <div>
      <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6">
        {t('admin.dashboard.title')}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <StatCard
          icon={ShoppingBag}
          label={t('admin.dashboard.totalOrders')}
          value={stats.totalOrders ?? 0}
          bgColor="bg-mint-50"
          iconColor="text-mint-600"
        />
        <StatCard
          icon={Clock}
          label={t('admin.dashboard.pendingOrders')}
          value={stats.pendingOrders ?? 0}
          bgColor="bg-warning-50"
          iconColor="text-warning-500"
        />
        <StatCard
          icon={DollarSign}
          label={t('admin.dashboard.totalRevenue')}
          value={formatCurrency(stats.totalRevenue ?? 0)}
          bgColor="bg-success-50"
          iconColor="text-success-500"
        />
        <StatCard
          icon={Users}
          label={t('admin.dashboard.registeredUsers')}
          value={stats.registeredUsers ?? 0}
          bgColor="bg-info-50"
          iconColor="text-info-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-lg font-semibold text-slate-800">
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
