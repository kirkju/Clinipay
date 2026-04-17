import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import SEOHead from '../../components/seo/SEOHead';
import { trackEvent } from '../../hooks/usePageTracking';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);
  const strengthLabels = [
    '',
    t('register.strengthWeak'),
    t('register.strengthMedium'),
    t('register.strengthStrong'),
    t('register.strengthVeryStrong'),
  ];
  const strengthColors = ['', 'bg-error-500', 'bg-warning-500', 'bg-warning-500', 'bg-success-500'];

  function validate() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = t('errors.firstNameRequired');
    if (!form.last_name.trim()) errs.last_name = t('errors.lastNameRequired');
    if (!form.email.trim()) errs.email = t('errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('errors.invalidEmail');
    if (!form.password) errs.password = t('errors.passwordRequired');
    else if (form.password.length < 8) errs.password = t('errors.passwordMinLength');
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = t('errors.passwordMismatch');
    if (!form.phone.trim()) errs.phone = t('errors.phoneRequired');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      trackEvent('sign_up', { method: 'email' });
      toast.success(t('success.register'));
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Crear Cuenta — CLINIPAY"
        description="Regístrate en CLINIPAY para comprar paquetes médicos en línea de forma segura y rápida."
        path="/register"
      />
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px] font-bold text-slate-800 mb-3">
            {t('register.title')}
          </h1>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-7 h-7 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-display font-bold text-lg text-forest-500">CLINIPAY</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="first_name"
                label={t('register.firstName')}
                placeholder={t('register.firstNamePlaceholder')}
                icon={User}
                value={form.first_name}
                onChange={handleChange('first_name')}
                error={errors.first_name}
              />
              <Input
                id="last_name"
                label={t('register.lastName')}
                placeholder={t('register.lastNamePlaceholder')}
                value={form.last_name}
                onChange={handleChange('last_name')}
                error={errors.last_name}
              />
            </div>

            <Input
              id="email"
              type="email"
              label={t('register.email')}
              placeholder={t('register.emailPlaceholder')}
              icon={Mail}
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
            />

            <div>
              <Input
                id="password"
                type="password"
                label={t('register.password')}
                placeholder={t('register.passwordPlaceholder')}
                icon={Lock}
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                            strength >= level
                              ? strengthColors[strength]
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-body">
                      {strengthLabels[strength]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              type="password"
              label={t('register.confirmPassword')}
              placeholder={t('register.confirmPasswordPlaceholder')}
              icon={Lock}
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
            />

            <Input
              id="phone"
              type="tel"
              label={t('register.phone')}
              placeholder={t('register.phonePlaceholder')}
              icon={Phone}
              value={form.phone}
              onChange={handleChange('phone')}
              error={errors.phone}
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('register.submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 font-body">
            {t('register.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-mint-600 font-medium hover:text-mint-700 transition-colors"
            >
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
