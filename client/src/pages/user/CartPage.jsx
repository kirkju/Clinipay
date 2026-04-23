import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Trash2, ArrowLeft, ShoppingBag, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/constants';
import Button from '../../components/ui/Button';
import PriceDisplay from '../../components/ui/PriceDisplay';
import SEOHead from '../../components/seo/SEOHead';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartTax,
    cartTotal,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const currency = items[0]?.snapshot.currency || 'USD';

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <SEOHead title={`${t('cart.title')} — CLINIPAY`} path="/cart" noIndex />

      <Link
        to="/packages"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('cart.continueShopping')}
      </Link>

      <h1 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-mint-500" />
        {t('cart.title')}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-700 mb-1.5">
            {t('cart.empty')}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6 font-body">
            {t('cart.emptyDesc')}
          </p>
          <Link to="/packages">
            <Button variant="secondary">{t('cart.browseCatalog')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.lineId}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base truncate">
                    {item.snapshot[`name_${lang}`] || item.snapshot.name_es}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 line-clamp-1 font-body">
                    {item.snapshot[`description_${lang}`] || item.snapshot.description_es}
                  </p>
                  <div className="mt-1">
                    <PriceDisplay pkg={item.snapshot} variant="default" />
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.lineId)}
                  className="p-2 rounded-lg text-slate-400 hover:text-error-500 hover:bg-error-50 transition-all duration-200 cursor-pointer flex-shrink-0"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-slate-400 hover:text-error-500 transition-colors cursor-pointer"
              >
                {t('cart.clearAll')}
              </button>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
              <h3 className="font-display text-lg font-semibold text-slate-800 mb-4">
                {t('cart.summary')}
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t('cart.items', { count: items.length })}</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatCurrency(cartSubtotal, currency)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-error-600">
                    <span>{t('cart.discount')}</span>
                    <span>−{formatCurrency(cartDiscount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t('cart.tax')}</span>
                  <span>{formatCurrency(cartTax, currency)}</span>
                </div>
                <hr className="border-slate-100" />
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{t('checkout.total')}</span>
                  <span className="text-xl text-mint-600">
                    {formatCurrency(cartTotal, currency)}
                  </span>
                </div>
              </div>
              <Button onClick={handleCheckout} className="w-full gap-2" size="lg">
                <ShoppingCart className="w-5 h-5" />
                {t('cart.proceedCheckout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
