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
import SEOHead from '../../components/seo/SEOHead';

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

  const rows = orders.map((order) => {
    const pkgName = order[`first_package_name_${lang}`] || order.first_package_name_es || '-';
    const label = order.item_count > 1 ? `${pkgName} +${order.item_count - 1}` : pkgName;
    return {
      id: order.id,
      cells: [
        <span className="font-mono text-sm font-medium text-slate-800">{order.order_number}</span>,
        <span className="text-slate-700">{order.user_first_name} {order.user_last_name}</span>,
        <span className="text-slate-600">{label}</span>,
        <span className="font-semibold text-slate-800">{formatCurrency(order.total_amount, order.currency)}</span>,
        <Badge status={order.status} />,
        <span className="text-slate-500 text-sm">{formatDate(order.created_at)}</span>,
      ],
    };
  });

  return (
    <div>
      <SEOHead title="Admin — CLINIPAY" path="/admin/orders" noIndex />
      <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6">
        {t('admin.orders.title')}
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              {t('common.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('admin.orders.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none transition-all duration-200 bg-white text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              {t('admin.orders.statusFilter')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none cursor-pointer transition-all duration-200 bg-white text-slate-800"
            >
              <option value="">{t('admin.orders.allStatuses')}</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`statuses.${s}`)}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-36">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              {t('admin.orders.dateFrom')}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none transition-all duration-200 bg-white text-slate-800"
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              {t('admin.orders.dateTo')}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none transition-all duration-200 bg-white text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="gap-1.5">
              <Filter className="w-4 h-4" />
              {t('common.filter')}
            </Button>
            <button
              type="button"
              onClick={clearFilters}
              className="p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
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
