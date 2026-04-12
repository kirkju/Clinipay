import { useTranslation } from 'react-i18next';
import { User, UserCheck } from 'lucide-react';
import Input from '../ui/Input';
import { useAuth } from '../../context/AuthContext';

const RELATIONSHIPS = ['self', 'spouse', 'child', 'parent', 'sibling', 'other'];

export default function PatientForm({ index, data, onChange, errors = {} }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  function handleChange(field, value) {
    onChange(index, { ...data, [field]: value });
  }

  function handleIsSelf(checked) {
    if (checked && user) {
      onChange(index, {
        ...data,
        patient_first_name: user.first_name || '',
        patient_last_name: user.last_name || '',
        patient_phone: user.phone || '',
        patient_email: user.email || '',
        patient_relationship: 'self',
      });
    } else {
      onChange(index, {
        ...data,
        patient_first_name: '',
        patient_last_name: '',
        patient_phone: '',
        patient_email: '',
        patient_relationship: 'self',
      });
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-mint-500" />
          {t('patient.title')} {index + 1}
        </h3>
      </div>

      {/* "I am the patient" checkbox */}
      <label className="flex items-center gap-2.5 mb-5 cursor-pointer group">
        <input
          type="checkbox"
          checked={data.patient_relationship === 'self' && data.patient_first_name === user?.first_name}
          onChange={(e) => handleIsSelf(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-mint-500 focus:ring-mint-500 cursor-pointer"
        />
        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-mint-500" />
          {t('patient.iAmPatient')}
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('patient.firstName') + ' *'}
          id={`patient_first_name_${index}`}
          value={data.patient_first_name}
          onChange={(e) => handleChange('patient_first_name', e.target.value)}
          placeholder={t('patient.firstNamePlaceholder')}
          error={errors.patient_first_name}
        />

        <Input
          label={t('patient.lastName') + ' *'}
          id={`patient_last_name_${index}`}
          value={data.patient_last_name}
          onChange={(e) => handleChange('patient_last_name', e.target.value)}
          placeholder={t('patient.lastNamePlaceholder')}
          error={errors.patient_last_name}
        />

        <Input
          label={t('patient.phone') + ' *'}
          id={`patient_phone_${index}`}
          type="tel"
          value={data.patient_phone}
          onChange={(e) => handleChange('patient_phone', e.target.value)}
          placeholder={t('patient.phonePlaceholder')}
          error={errors.patient_phone}
        />

        <Input
          label={t('patient.birthDate') + ' *'}
          id={`patient_birth_date_${index}`}
          type="date"
          value={data.patient_birth_date}
          onChange={(e) => handleChange('patient_birth_date', e.target.value)}
          error={errors.patient_birth_date}
        />

        <Input
          label={t('patient.idNumber')}
          id={`patient_id_number_${index}`}
          value={data.patient_id_number}
          onChange={(e) => handleChange('patient_id_number', e.target.value)}
          placeholder={t('patient.idNumberPlaceholder')}
          error={errors.patient_id_number}
        />

        <Input
          label={t('patient.email')}
          id={`patient_email_${index}`}
          type="email"
          value={data.patient_email}
          onChange={(e) => handleChange('patient_email', e.target.value)}
          placeholder={t('patient.emailPlaceholder')}
          error={errors.patient_email}
        />

        <div className="w-full space-y-1.5">
          <label
            htmlFor={`patient_relationship_${index}`}
            className="block text-sm font-medium text-slate-700"
          >
            {t('patient.relationship')}
          </label>
          <select
            id={`patient_relationship_${index}`}
            value={data.patient_relationship}
            onChange={(e) => handleChange('patient_relationship', e.target.value)}
            className="w-full px-4 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-base sm:text-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 cursor-pointer"
          >
            {RELATIONSHIPS.map((rel) => (
              <option key={rel} value={rel}>
                {t(`patient.relationships.${rel}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full space-y-1.5 sm:col-span-2">
          <label
            htmlFor={`patient_notes_${index}`}
            className="block text-sm font-medium text-slate-700"
          >
            {t('patient.notes')}
          </label>
          <textarea
            id={`patient_notes_${index}`}
            value={data.patient_notes}
            onChange={(e) => handleChange('patient_notes', e.target.value)}
            placeholder={t('patient.notesPlaceholder')}
            rows={2}
            className="w-full px-4 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-base sm:text-sm placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 resize-y min-h-[60px]"
          />
        </div>
      </div>
    </div>
  );
}
