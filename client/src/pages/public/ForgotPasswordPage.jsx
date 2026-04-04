import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success(t('success.forgotPasswordSent'));
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            {t('forgotPassword.title')}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-dark mb-2">
                {t('forgotPassword.successTitle')}
              </h2>
              <p className="text-gray-500 mb-6">
                {t('forgotPassword.successMessage')}
              </p>
              <Link to="/login">
                <Button variant="secondary">{t('forgotPassword.backToLogin')}</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-6">
                {t('forgotPassword.description')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label={t('forgotPassword.email')}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />
                <Button type="submit" loading={loading} className="w-full">
                  {t('forgotPassword.submit')}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
