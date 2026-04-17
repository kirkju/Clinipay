import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import SEOHead from '../../components/seo/SEOHead';
import { trackEvent } from '../../hooks/usePageTracking';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.email) errs.email = t('errors.emailRequired');
    if (!form.password) errs.password = t('errors.passwordRequired');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      trackEvent('login', { method: 'email' });
      toast.success(t('success.login'));
      navigate(returnUrl, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Iniciar Sesión — CLINIPAY"
        description="Accede a tu cuenta CLINIPAY para gestionar tus paquetes médicos y ver el estado de tus órdenes."
        path="/login"
      />
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px] font-bold text-slate-800 mb-3">
            {t('login.title')}
          </h1>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-7 h-7 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-display font-bold text-lg text-forest-500">CLINIPAY</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              id="email"
              type="email"
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              icon={Mail}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />

            <Input
              id="password"
              type="password"
              label={t('login.password')}
              placeholder={t('login.passwordPlaceholder')}
              icon={Lock}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-mint-600 hover:text-mint-700 transition-colors font-medium"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            <div className="flex justify-center">
              <Button type="submit" loading={loading} className="w-full sm:w-full">
                {t('login.submit')}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 font-body">
            {t('login.noAccount')}{' '}
            <Link
              to="/register"
              className="text-mint-600 font-medium hover:text-mint-700 transition-colors"
            >
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
