import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { t } = useTranslation();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs = {};
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
      await resetPassword(token, form.password);
      setSuccess(true);
      toast.success(t('success.passwordReset'));
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
          <h1 className="font-display text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px] font-bold text-slate-800">
            {t('resetPassword.title')}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <p className="text-slate-600 mb-6 font-body">{t('resetPassword.successMessage')}</p>
              <Link to="/login">
                <Button>{t('resetPassword.backToLogin')}</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="password"
                type="password"
                label={t('resetPassword.newPassword')}
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                icon={Lock}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
              />

              <Input
                id="confirmPassword"
                type="password"
                label={t('resetPassword.confirmPassword')}
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                icon={Lock}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                error={errors.confirmPassword}
              />

              <Button type="submit" loading={loading} className="w-full">
                {t('resetPassword.submit')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
