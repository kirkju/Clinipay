import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { getUsers } from '../../services/admin.service';
import { formatDate } from '../../utils/constants';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import SEOHead from '../../components/seo/SEOHead';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data.users || data);
    } catch {
      // handled
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
    t('admin.users.name'),
    t('admin.users.email'),
    t('admin.users.registrationDate'),
    t('admin.users.orderCount'),
  ];

  const rows = users.map((user) => ({
    id: user.id,
    cells: [
      <span className="font-medium text-slate-800">
        {user.first_name} {user.last_name}
      </span>,
      <span className="text-slate-600">{user.email}</span>,
      <span className="text-slate-500 text-sm">{formatDate(user.created_at)}</span>,
      <span className="font-semibold text-slate-800">{user.order_count ?? 0}</span>,
    ],
  }));

  return (
    <div>
      <SEOHead title="Admin — CLINIPAY" path="/admin/users" noIndex />
      <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6">
        {t('admin.users.title')}
      </h1>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-700 mb-1.5">
            {t('admin.users.noUsers')}
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <Table headers={headers} rows={rows} />
        </div>
      )}
    </div>
  );
}
