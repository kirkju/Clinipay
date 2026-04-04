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
      className={`bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-text-dark'
                }`}
                title={collapsed ? t(`admin.sidebar.${item.key}`) : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span>{t(`admin.sidebar.${item.key}`)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
