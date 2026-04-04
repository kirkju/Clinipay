import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { getUsers } from '../../services/admin.service';
import { formatDate } from '../../utils/constants';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

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
      <span className="font-medium">
        {user.first_name} {user.last_name}
      </span>,
      <span className="text-gray-600">{user.email}</span>,
      <span className="text-gray-500 text-sm">{formatDate(user.created_at)}</span>,
      <span className="font-semibold">{user.order_count ?? 0}</span>,
    ],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-dark mb-6">
        {t('admin.users.title')}
      </h1>

      {users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('admin.users.noUsers')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table headers={headers} rows={rows} />
        </div>
      )}
    </div>
  );
}
