import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-mint-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-xl text-white">CLINIPAY</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer.links')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/packages" className="text-slate-400 hover:text-mint-400 transition-colors">
                  {t('navbar.catalog')}
                </Link>
              </li>
              <li>
                <span className="text-slate-400 hover:text-mint-400 transition-colors cursor-pointer">
                  {t('footer.terms')}
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-mint-400 transition-colors cursor-pointer">
                  {t('footer.privacy')}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer.contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-mint-400" />
                {t('footer.email')}
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-mint-400" />
                {t('footer.phone')}
              </li>
            </ul>
          </div>

          {/* Extra column for grid balance */}
          <div className="hidden lg:block" />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>{t('footer.copyright', { year })}</span>
          <div className="flex items-center gap-1">
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-3.5 h-3.5 text-mint-500 fill-mint-500" />
            <span>{t('footer.inPanama')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
