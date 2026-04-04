import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, CreditCard, CalendarCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { getActivePackages } from '../../services/packages.service';
import { formatCurrency } from '../../utils/constants';
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
      <section className="relative overflow-hidden bg-gradient-to-br from-mint-50 via-white to-mint-100/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mint-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-mint-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="max-w-[700px] mx-auto text-center">
            <h1 className="font-display text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px] lg:text-[48px] lg:leading-[56px] font-bold text-slate-800 mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base sm:text-[17px] lg:text-lg text-slate-500 mb-10 leading-relaxed font-body max-w-xl mx-auto">
              {t('home.heroSubtitle')}
            </p>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 justify-center"
            >
              {t('home.heroCTA')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-10 sm:py-12 lg:py-16">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 text-center mb-10 sm:mb-14">
            {t('home.howItWorksTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="text-center animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-mint-50 flex items-center justify-center">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-mint-500" />
                  </div>
                  <div className="flex items-center justify-center mb-3 gap-2">
                    <span className="w-7 h-7 rounded-full bg-mint-500 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-700">
                      {t(`home.${step.titleKey}`)}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-body">
                    {t(`home.${step.descKey}`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="bg-slate-50 py-10 sm:py-12 lg:py-16">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] lg:text-[36px] lg:leading-[42px] font-bold text-slate-800 mb-3">
              {t('home.featuredTitle')}
            </h2>
            <p className="text-slate-500 text-base sm:text-lg font-body">{t('home.featuredSubtitle')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
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
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 font-body">
                        {pkg[`description_${lang}`] || pkg.description_es}
                      </p>
                      <ul className="space-y-2.5">
                        {includes.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <CheckCircle className="w-5 h-5 text-mint-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer CTA */}
                    <div className="p-5 sm:p-6 pt-0">
                      <Link
                        to={`/packages/${pkg.id}`}
                        className="block w-full bg-mint-500 hover:bg-mint-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 group-hover:shadow-md text-center text-sm sm:text-base"
                      >
                        {t('home.viewMore')}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-forest-500 font-semibold border-2 border-mint-500 hover:border-mint-600 rounded-lg transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
            >
              {t('home.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
