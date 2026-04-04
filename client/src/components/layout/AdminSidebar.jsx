import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { key: 'orders', path: '/admin/orders', icon: ShoppingBag },
  { key: 'packages', path: '/admin/packages', icon: Package },
  { key: 'users', path: '/admin/users', icon: Users },
];

export default function AdminSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(item) {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  }

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-white border-r border-slate-200
        min-h-[calc(100vh-4.5rem)]
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-mint-500
                ${active
                  ? 'bg-mint-50 text-mint-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }
              `}
              title={collapsed ? t(`admin.sidebar.${item.key}`) : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-mint-600' : ''}`} />
              {!collapsed && (
                <span>{t(`admin.sidebar.${item.key}`)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-slate-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
