import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, CreditCard, CalendarCheck, ArrowRight } from 'lucide-react';
import { getActivePackages } from '../../services/packages.service';
import { formatCurrency } from '../../utils/constants';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function HomePage() {
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
      setPackages((data.packages || data).slice(0, 3));
    } catch {
      // silently fail for featured section
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { icon: Package, titleKey: 'step1Title', descKey: 'step1Desc' },
    { icon: CreditCard, titleKey: 'step2Title', descKey: 'step2Desc' },
    { icon: CalendarCheck, titleKey: 'step3Title', descKey: 'step3Desc' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary-light/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-light/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-dark leading-tight mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            <Link to="/packages">
              <Button size="lg" className="gap-2">
                {t('home.heroCTA')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-3">
            {t('home.featuredTitle')}
          </h2>
          <p className="text-gray-500 text-lg">{t('home.featuredSubtitle')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                image={
                  <Package className="w-16 h-16 text-primary/60" />
                }
                title={pkg[`name_${lang}`] || pkg.name_es}
              >
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {pkg[`description_${lang}`] || pkg.description_es}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(pkg.price, pkg.currency)}
                  </span>
                  <Link to={`/packages/${pkg.id}`}>
                    <Button variant="secondary" size="sm">
                      {t('home.viewMore')}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/packages">
            <Button variant="secondary" className="gap-2">
              {t('home.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background-alt py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-dark text-center mb-14">
            {t('home.howItWorksTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex items-center justify-center mb-3">
                    <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mr-2">
                      {idx + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-text-dark">
                      {t(`home.${step.titleKey}`)}
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    {t(`home.${step.descKey}`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
