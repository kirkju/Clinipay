import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { googleLogin } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

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

            <Button type="submit" loading={loading} className="w-full">
              {t('login.submit')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-400 font-body">
                  {t('login.orDivider')}
                </span>
              </div>
            </div>

            <button
              onClick={googleLogin}
              type="button"
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-2.5 border-2 border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('login.googleButton')}
            </button>
          </div>

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
