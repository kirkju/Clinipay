import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from 'lucide-react';
import { getOrders } from '../../services/admin.service';
import { formatCurrency, formatDate, ORDER_STATUSES } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });

  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [filters.page, filters.status, fetchTrigger]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      params.page = filters.page;
      params.limit = 15;

      const data = await getOrders(params);
      setOrders(data.orders || data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    setFetchTrigger((n) => n + 1);
  }

  function clearFilters() {
    setFilters({ status: '', search: '', dateFrom: '', dateTo: '', page: 1 });
    setFetchTrigger((n) => n + 1);
  }

  const headers = [
    t('admin.orders.orderNumber'),
    t('admin.orders.client'),
    t('admin.orders.package'),
    t('admin.orders.amount'),
    t('admin.orders.status'),
    t('admin.orders.date'),
  ];

  const rows = orders.map((order) => ({
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
        {t('admin.orders.title')}
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('common.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.orders.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="w-44">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('admin.orders.statusFilter')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none cursor-pointer"
            >
              <option value="">{t('admin.orders.allStatuses')}</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`statuses.${s}`)}</option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('admin.orders.dateFrom')}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            />
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('admin.orders.dateTo')}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="gap-1">
              <Filter className="w-4 h-4" />
              {t('common.filter')}
            </Button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            headers={headers}
            rows={rows}
            onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
            pagination={pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
            emptyMessage={t('admin.orders.noOrders')}
          />
        )}
      </div>
    </div>
  );
}
