import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, CheckCircle, ShoppingCart } from 'lucide-react';
import { getActivePackages } from '../../services/packages.service';
import { formatCurrency } from '../../utils/constants';
import { useCart } from '../../context/CartContext';
import Spinner from '../../components/ui/Spinner';
import SEOHead from '../../components/seo/SEOHead';
import toast from 'react-hot-toast';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-200 h-40 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-200 rounded-md w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded-md w-full animate-pulse" />
        <div className="h-4 bg-slate-100 rounded-md w-5/6 animate-pulse" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-11 bg-slate-200 rounded-xl mt-4 animate-pulse" />
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const data = await getActivePackages();
      setPackages(data.packages || data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }

  const catalogSD = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Paquetes Médicos',
    description: 'Catálogo de paquetes médicos disponibles en CLINIPAY',
    numberOfItems: packages.length,
    itemListElement: packages.map((pkg, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: pkg[`name_${lang}`] || pkg.name_es,
        description: pkg[`description_${lang}`] || pkg.description_es,
        offers: {
          '@type': 'Offer',
          price: String(pkg.price),
          priceCurrency: pkg.currency || 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <SEOHead
        title="Paquetes Médicos — CLINIPAY"
        description="Explora nuestro catálogo de paquetes médicos. Encuentra el servicio de salud que necesitas y compra en línea de forma segura."
        path="/packages"
        structuredData={!loading && packages.length > 0 ? catalogSD : undefined}
      />
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-display text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px] font-bold text-slate-800 mb-3">
          {t('catalog.title')}
        </h1>
        <p className="text-slate-500 text-base sm:text-lg font-body">{t('catalog.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-700 mb-1.5">
            {t('catalog.noPackages')}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {packages.map((pkg) => {
            const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];
            return (
              <div
                key={pkg.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                {/* Header gradient */}
                <div className="bg-gradient-to-br from-mint-400 to-mint-600 px-5 py-6 sm:px-6 sm:py-8">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                    {pkg[`name_${lang}`] || pkg.name_es}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {formatCurrency(pkg.price, pkg.currency)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 sm:p-6 space-y-4">
                  <p className="text-slate-600 text-sm leading-relaxed font-body">
                    {pkg[`description_${lang}`] || pkg.description_es}
                  </p>
                  <ul className="space-y-2.5">
                    {includes.slice(0, 4).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-5 h-5 text-mint-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {includes.length > 4 && (
                      <li className="text-sm text-slate-400 pl-7">
                        +{includes.length - 4} ...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Footer CTA */}
                <div className="p-5 sm:p-6 pt-0 space-y-2">
                  <Link
                    to={`/packages/${pkg.id}`}
                    className="block w-full bg-mint-500 hover:bg-mint-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 group-hover:shadow-md text-center text-sm sm:text-base"
                  >
                    {t('catalog.viewDetails')}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(pkg);
                      toast.success(t('cart.added'));
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-mint-500 text-mint-600 hover:bg-mint-50 font-semibold transition-all duration-200 text-sm sm:text-base cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t('cart.addToCart')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
