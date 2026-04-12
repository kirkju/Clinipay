import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown, User, LogOut, ShoppingBag, ShoppingCart, Shield, Globe, Home, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-navbar">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-xl text-forest-500">
                CLINIPAY
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 font-medium text-sm"
              >
                {t('navbar.home')}
              </Link>
              <Link
                to="/packages"
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 font-medium text-sm"
              >
                {t('navbar.catalog')}
              </Link>
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <Globe className="w-4 h-4" />
                {currentLang.toUpperCase()}
              </button>

              {/* Cart icon */}
              <Link
                to="/cart"
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-mint-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
                  >
                    <div className="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-mint-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {user?.first_name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-elevated border border-slate-200 py-1.5 z-50 animate-fade-in-down">
                      <Link
                        to="/my-orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        {t('navbar.myOrders')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-slate-400" />
                          {t('navbar.adminPanel')}
                        </Link>
                      )}
                      <hr className="my-1.5 border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error-500 hover:bg-error-50 transition-colors cursor-pointer"
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
                  className="px-5 py-2.5 bg-mint-500 text-white rounded-lg font-semibold hover:bg-mint-600 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
                >
                  {t('navbar.login')}
                </Link>
              )}
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/cart"
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-mint-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white animate-fade-in">
          <div className="flex flex-col h-full">
            {/* Header with close */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="font-display font-bold text-lg text-forest-500">CLINIPAY</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-4 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                <Home className="w-5 h-5 text-slate-400" />
                {t('navbar.home')}
              </Link>
              <Link
                to="/packages"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                <Package className="w-5 h-5 text-slate-400" />
                {t('navbar.catalog')}
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-400" />
                {t('navbar.cart')}
                {cartCount > 0 && (
                  <span className="ml-auto bg-mint-100 text-mint-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                    {t('navbar.myOrders')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <Shield className="w-5 h-5 text-slate-400" />
                      {t('navbar.adminPanel')}
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 space-y-3">
              <button
                onClick={() => { toggleLanguage(); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer border border-slate-200"
              >
                <Globe className="w-4 h-4" />
                {currentLang === 'es' ? 'English' : 'Espa\u00f1ol'}
              </button>

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-error-500 hover:bg-error-50 font-medium transition-colors cursor-pointer border border-error-100"
                >
                  <LogOut className="w-4 h-4" />
                  {t('navbar.logout')}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center w-full px-4 py-3 bg-mint-500 text-white rounded-lg font-semibold hover:bg-mint-600 transition-colors"
                >
                  {t('navbar.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
