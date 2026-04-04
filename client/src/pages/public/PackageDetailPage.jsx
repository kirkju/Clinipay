import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { getPackageById } from '../../services/packages.service';
import { formatCurrency } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function PackageDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  useEffect(() => {
    fetchPackage();
  }, [id]);

  async function fetchPackage() {
    try {
      const data = await getPackageById(id);
      setPkg(data.package || data);
    } catch {
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }

  function handleBuy() {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/checkout/${id}` } });
    } else {
      navigate(`/checkout/${id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-6">{t('packageDetail.notFound')}</p>
        <Link to="/packages">
          <Button variant="secondary">{t('packageDetail.backToCatalog')}</Button>
        </Link>
      </div>
    );
  }

  const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/packages"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('packageDetail.backToCatalog')}
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-primary-light/30 via-primary/10 to-primary-light/20 flex items-center justify-center">
          <ShoppingCart className="w-20 h-20 text-primary/40" />
        </div>

        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-text-dark">
              {pkg[`name_${lang}`] || pkg.name_es}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('packageDetail.price')}</span>
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(pkg.price, pkg.currency)}
              </span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-8">
            {pkg[`description_${lang}`] || pkg.description_es}
          </p>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-text-dark mb-4">
              {t('packageDetail.includes')}
            </h3>
            <ul className="space-y-3">
              {includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleBuy} size="lg" className="w-full sm:w-auto gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t('packageDetail.buyNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
