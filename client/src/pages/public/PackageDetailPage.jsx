import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, ShoppingCart } from 'lucide-react';
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
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <ShoppingCart className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 text-lg mb-6 font-body">{t('packageDetail.notFound')}</p>
        <Link to="/packages">
          <Button variant="secondary">{t('packageDetail.backToCatalog')}</Button>
        </Link>
      </div>
    );
  }

  const includes = pkg[`includes_${lang}`] || pkg.includes_es || [];

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Link
        to="/packages"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-mint-600 transition-colors mb-8 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('packageDetail.backToCatalog')}
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-mint-400 to-mint-600 px-6 sm:px-8 py-8 sm:py-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            {pkg[`name_${lang}`] || pkg.name_es}
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-white">
              {formatCurrency(pkg.price, pkg.currency)}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-slate-600 text-base leading-relaxed mb-8 font-body">
            {pkg[`description_${lang}`] || pkg.description_es}
          </p>

          <div className="mb-8">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-800 mb-4">
              {t('packageDetail.includes')}
            </h3>
            <ul className="space-y-3">
              {includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-mint-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleBuy} size="lg" className="gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t('packageDetail.buyNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
