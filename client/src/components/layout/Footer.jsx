import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-text-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-bold text-primary">CLINI</span>
              <span className="text-xl font-bold text-primary-light">PAY</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('footer.links')}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/packages"
                  className="text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  {t('navbar.catalog')}
                </Link>
              </li>
              <li>
                <span className="text-sm text-gray-400">{t('footer.terms')}</span>
              </li>
              <li>
                <span className="text-sm text-gray-400">{t('footer.privacy')}</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('footer.contact')}</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-primary" />
                {t('footer.email')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-primary" />
                {t('footer.phone')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {t('footer.copyright', { year })}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>{t('footer.inPanama')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
