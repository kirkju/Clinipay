import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  getPackages,
  createPackage,
  updatePackage,
  togglePackage,
} from '../../services/admin.service';
import SEOHead from '../../components/seo/SEOHead';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import PriceDisplay from '../../components/ui/PriceDisplay';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const emptyForm = {
  name_es: '',
  name_en: '',
  description_es: '',
  description_en: '',
  price: '',
  currency: 'USD',
  includes_es: '',
  includes_en: '',
  display_order: 0,
  discount_percentage: 0,
  senior_discount_enabled: false,
};

export default function AdminPackagesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const data = await getPackages();
      setPackages(data.packages || data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPkg(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(pkg) {
    setEditingPkg(pkg);
    setForm({
      name_es: pkg.name_es || '',
      name_en: pkg.name_en || '',
      description_es: pkg.description_es || '',
      description_en: pkg.description_en || '',
      price: pkg.price?.toString() || '',
      currency: pkg.currency || 'USD',
      includes_es: (pkg.includes_es || []).join('\n'),
      includes_en: (pkg.includes_en || []).join('\n'),
      display_order: pkg.display_order || 0,
      discount_percentage: pkg.discount_percentage ?? 0,
      senior_discount_enabled: !!pkg.senior_discount_enabled,
    });
    setShowModal(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      price: parseFloat(form.price),
      display_order: parseInt(form.display_order) || 0,
      discount_percentage: Math.min(Math.max(parseFloat(form.discount_percentage) || 0, 0), 100),
      senior_discount_enabled: !!form.senior_discount_enabled,
      includes_es: form.includes_es.split('\n').filter((s) => s.trim()),
      includes_en: form.includes_en.split('\n').filter((s) => s.trim()),
    };

    setSaving(true);
    try {
      if (editingPkg) {
        await updatePackage(editingPkg.id, payload);
        toast.success(t('success.packageUpdated'));
      } else {
        await createPackage(payload);
        toast.success(t('success.packageCreated'));
      }
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(pkg) {
    try {
      await togglePackage(pkg.id);
      toast.success(t('success.packageToggled'));
      fetchPackages();
    } catch (err) {
      const message = err.response?.data?.message || t('errors.generic');
      toast.error(message);
    }
  }

  function handleChange(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const headers = [
    t('admin.packages.name'),
    t('admin.packages.price'),
    t('admin.packages.displayOrder'),
    t('admin.packages.status'),
    t('admin.packages.actions'),
  ];

  const rows = packages.map((pkg) => ({
    id: pkg.id,
    cells: [
      <span className="font-medium text-slate-800">{pkg[`name_${lang}`] || pkg.name_es}</span>,
      <PriceDisplay pkg={pkg} variant="compact" />,
      <span className="text-slate-500">{pkg.display_order}</span>,
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          pkg.is_active
            ? 'bg-success-100 text-success-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${pkg.is_active ? 'bg-success-500' : 'bg-slate-400'}`} />
        {pkg.is_active ? t('admin.packages.active') : t('admin.packages.inactive')}
      </span>,
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEdit(pkg);
          }}
          className="p-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
          title={t('common.edit')}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(pkg);
          }}
          className="p-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-500"
          title={t('admin.packages.toggleActive')}
        >
          {pkg.is_active ? (
            <ToggleRight className="w-5 h-5 text-success-500" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>,
    ],
  }));

  return (
    <div>
      <SEOHead title="Admin — CLINIPAY" path="/admin/packages" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800">
          {t('admin.packages.title')}
        </h1>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          {t('admin.packages.createNew')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <Table
          headers={headers}
          rows={rows}
          emptyMessage={t('admin.packages.noPackages')}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingPkg ? t('admin.packages.editPackage') : t('admin.packages.createNew')}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="name_es"
              label={t('admin.packages.nameEs')}
              value={form.name_es}
              onChange={handleChange('name_es')}
            />
            <Input
              id="name_en"
              label={t('admin.packages.nameEn')}
              value={form.name_en}
              onChange={handleChange('name_en')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('admin.packages.descriptionEs')}
            </label>
            <textarea
              value={form.description_es}
              onChange={handleChange('description_es')}
              rows={3}
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none resize-y min-h-[80px] transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('admin.packages.descriptionEn')}
            </label>
            <textarea
              value={form.description_en}
              onChange={handleChange('description_en')}
              rows={3}
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none resize-y min-h-[80px] transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="price"
              type="number"
              label={t('admin.packages.price')}
              value={form.price}
              onChange={handleChange('price')}
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('admin.packages.currency')}
              </label>
              <select
                value={form.currency}
                onChange={handleChange('currency')}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none cursor-pointer transition-all duration-200"
              >
                <option value="USD">USD</option>
                <option value="PAB">PAB</option>
              </select>
            </div>
            <Input
              id="display_order"
              type="number"
              label={t('admin.packages.displayOrder')}
              value={form.display_order}
              onChange={handleChange('display_order')}
              min="0"
            />
          </div>

          <div>
            <Input
              id="discount_percentage"
              type="number"
              label={t('admin.packages.discountPercentage')}
              value={form.discount_percentage}
              onChange={handleChange('discount_percentage')}
              min="0"
              max="100"
              step="0.01"
            />
            <p className="text-xs text-slate-400 mt-1.5 font-body">
              {t('admin.packages.discountHelp')}
            </p>
          </div>

          <div className="bg-mint-50 border border-mint-100 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.senior_discount_enabled}
                onChange={(e) => setForm({ ...form, senior_discount_enabled: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-mint-500 focus:ring-mint-500 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {t('admin.packages.seniorDiscountLabel')}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-body">
                  {t('admin.packages.seniorDiscountHelp')}
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('admin.packages.includesEs')}
            </label>
            <textarea
              value={form.includes_es}
              onChange={handleChange('includes_es')}
              rows={4}
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none resize-y min-h-[100px] transition-all duration-200 font-mono placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('admin.packages.includesEn')}
            </label>
            <textarea
              value={form.includes_en}
              onChange={handleChange('includes_en')}
              rows={4}
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm hover:border-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25 outline-none resize-y min-h-[100px] transition-all duration-200 font-mono placeholder:text-slate-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
