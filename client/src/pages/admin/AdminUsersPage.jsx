import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, ShieldCheck } from 'lucide-react';
import { getUsers, updateUserRole } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import SEOHead from '../../components/seo/SEOHead';

const ROLE_BADGE = {
  client: 'blue',
  admin: 'purple',
  superadmin: 'success',
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSuperadmin = currentUser?.role === 'superadmin';

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

  async function handleToggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(t('admin.users.roleUpdated', { role: newRole }));
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
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
    t('admin.users.role'),
    t('admin.users.registrationDate'),
    t('admin.users.orderCount'),
    ...(isSuperadmin ? [t('admin.users.actions')] : []),
  ];

  const rows = users.map((user) => {
    const cells = [
      <span className="font-medium text-slate-800">
        {user.first_name} {user.last_name}
      </span>,
      <span className="text-slate-600">{user.email}</span>,
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
          user.role === 'superadmin'
            ? 'bg-mint-100 text-mint-700'
            : user.role === 'admin'
            ? 'bg-forest-600/10 text-forest-600'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {user.role === 'superadmin' && <ShieldCheck className="w-3 h-3" />}
        {user.role === 'admin' && <Shield className="w-3 h-3" />}
        {user.role}
      </span>,
      <span className="text-slate-500 text-sm">{formatDate(user.created_at)}</span>,
      <span className="font-semibold text-slate-800">{user.order_count ?? 0}</span>,
    ];

    if (isSuperadmin) {
      const canChange = user.id !== currentUser.id && user.role !== 'superadmin';
      cells.push(
        canChange ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleRole(user.id, user.role);
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
              user.role === 'admin'
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-mint-50 text-mint-700 hover:bg-mint-100'
            }`}
          >
            {user.role === 'admin'
              ? t('admin.users.demoteToClient')
              : t('admin.users.promoteToAdmin')}
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      );
    }

    return { id: user.id, cells };
  });

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
