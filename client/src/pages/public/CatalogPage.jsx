import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Check } from 'lucide-react';
import { getActivePackages } from '../../services/packages.service';
import { formatCurrency } from '../../utils/constants';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-7 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">
          {t('catalog.title')}
        </h1>
        <p className="text-gray-500 text-lg">{t('catalog.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('catalog.noPackages')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];
            return (
              <div
                key={pkg.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-primary-light/30 to-primary/10 flex items-center justify-center">
                  <Package className="w-14 h-14 text-primary/50" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-text-dark mb-2">
                    {pkg[`name_${lang}`] || pkg.name_es}
                  </h3>

                  <ul className="space-y-1.5 mb-4">
                    {includes.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {includes.length > 3 && (
                      <li className="text-sm text-gray-400 pl-6">
                        +{includes.length - 3} ...
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(pkg.price, pkg.currency)}
                    </span>
                    <Link to={`/packages/${pkg.id}`}>
                      <Button variant="secondary" size="sm">
                        {t('catalog.viewDetails')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
