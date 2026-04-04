import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { googleLogin } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

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
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            {t('register.title')}
          </h1>
          <div className="flex items-center gap-1 justify-center">
            <span className="text-xl font-bold text-primary">CLINI</span>
            <span className="text-xl font-bold text-primary-dark">PAY</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                          className={`h-1.5 flex-1 rounded-full ${
                            strength >= level
                              ? strengthColors[strength]
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
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
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('register.submit')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  {t('register.orDivider')}
                </span>
              </div>
            </div>

            <button
              onClick={googleLogin}
              type="button"
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-text-dark font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('register.googleButton')}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('register.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
