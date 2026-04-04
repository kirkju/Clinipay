import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown, User, LogOut, ShoppingBag, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';

  function toggleLanguage() {
    const newLang = currentLang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success(t('success.logout'));
      navigate('/');
    } catch {
      toast.error(t('errors.generic'));
    }
    setUserMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">CLINI</span>
            <span className="text-2xl font-bold text-primary-dark">PAY</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-text-dark hover:text-primary transition-colors font-medium"
            >
              {t('navbar.home')}
            </Link>
            <Link
              to="/packages"
              className="text-text-dark hover:text-primary transition-colors font-medium"
            >
              {t('navbar.catalog')}
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {currentLang.toUpperCase()}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-text-dark">
                    {user?.first_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/my-orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-gray-50 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {t('navbar.myOrders')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-gray-50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        {t('navbar.adminPanel')}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navbar.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                {t('navbar.login')}
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-text-dark hover:bg-gray-50 font-medium transition-colors"
            >
              {t('navbar.home')}
            </Link>
            <Link
              to="/packages"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-text-dark hover:bg-gray-50 font-medium transition-colors"
            >
              {t('navbar.catalog')}
            </Link>

            <button
              onClick={() => { toggleLanguage(); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {currentLang === 'es' ? 'English' : 'Espa\u00f1ol'}
            </button>

            <hr className="border-gray-100" />

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-dark hover:bg-gray-50 font-medium transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t('navbar.myOrders')}
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-dark hover:bg-gray-50 font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    {t('navbar.adminPanel')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-error hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {t('navbar.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center px-3 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                {t('navbar.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
