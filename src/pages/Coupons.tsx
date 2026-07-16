import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Plus, Save } from 'lucide-react';
import api from '../api/client';
import { BrandedSelect, iconButtonClass, inputClass, Pagination, panelClass, primaryButtonClass, secondaryButtonClass, SortDirection, SortHeader, tableClass, TableSkeletonRows, TableToolbar, tdClass, thClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Coupon } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percent' as Coupon['discount_type'],
  discount_value: '',
  min_order_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  expires_at: '',
  is_active: true,
};

const discountTypeOptions = [
  { value: 'percent', label: 'Percent' },
  { value: 'fixed', label: 'Fixed' },
];

function getInitialForm(coupon: Coupon | null) {
  if (!coupon) return emptyForm;

  return {
    code: coupon.code,
    description: coupon.description || '',
    discount_type: coupon.discount_type,
    discount_value: String(coupon.discount_value),
    min_order_amount: String(coupon.min_order_amount || '0'),
    max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
    usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
    expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
    is_active: coupon.is_active,
  };
}

function CouponFormPage({
  coupon,
  onCancel,
  onSaved,
}: {
  coupon: Coupon | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(getInitialForm(coupon));
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      max_discount_amount: form.max_discount_amount || null,
      usage_limit: form.usage_limit || null,
      expires_at: form.expires_at || null,
    };

    try {
      setSaving(true);
      if (coupon) {
        await api.put(endpoints.admin.coupon(coupon.id), payload);
        toast.success('Coupon updated');
      } else {
        await api.post(endpoints.admin.coupons, payload);
        toast.success('Coupon created');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={panelClass}>
      <form onSubmit={submit}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Coupon setup</p>
            <h2 className="m-0 text-2xl font-black tracking-tight">{coupon ? 'Edit coupon' : 'Add coupon'}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">Use this same page for creating and editing coupons.</p>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={onCancel}><ArrowLeft size={18} /> Back to coupons</button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-stone-600">Code<input className={inputClass} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required /></label>
          <BrandedSelect label="Type" value={form.discount_type} onChange={(value) => setForm({ ...form, discount_type: value as Coupon['discount_type'] })} options={discountTypeOptions} />
          <label className="grid gap-2 text-sm font-bold text-stone-600">Discount<input className={inputClass} type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Minimum order<input className={inputClass} type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(event) => setForm({ ...form, min_order_amount: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Max discount<input className={inputClass} type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={(event) => setForm({ ...form, max_discount_amount: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Usage limit<input className={inputClass} type="number" min="1" value={form.usage_limit} onChange={(event) => setForm({ ...form, usage_limit: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Expires<input className={inputClass} type="date" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} /></label>
          <label className="flex items-center gap-2 self-end text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active coupon</label>
          <label className="grid gap-2 text-sm font-bold text-stone-600 md:col-span-2">Description<textarea className={inputClass} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        </div>

        <button className={primaryButtonClass} disabled={saving}><Save size={18} /> {saving ? 'Saving...' : coupon ? 'Update coupon' : 'Create coupon'}</button>
      </form>
    </section>
  );
}

export function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formMode, setFormMode] = useState<'list' | 'form'>('list');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'code' | 'discount' | 'minimum' | 'usage' | 'status' | 'expires'>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [couponToToggle, setCouponToToggle] = useState<Coupon | null>(null);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: sortKey === 'discount' ? 'discount_value' : sortKey === 'minimum' ? 'min_order_amount' : sortKey === 'usage' ? 'used_count' : sortKey === 'status' ? 'is_active' : sortKey === 'expires' ? 'expires_at' : sortKey,
        order: sortDirection,
      });
      if (query) params.set('search', query);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await api.get(`${endpoints.admin.coupons}?${params.toString()}`);
      setCoupons(res.data.coupons);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load coupons');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortKey, sortDirection, query, statusFilter, typeFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const toggleActive = async (coupon: Coupon) => {
    await api.put(endpoints.admin.coupon(coupon.id), { is_active: !coupon.is_active });
    toast.success(coupon.is_active ? 'Coupon disabled' : 'Coupon enabled');
    loadCoupons();
  };

  const updateSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  if (formMode === 'form') {
    return (
      <CouponFormPage
        coupon={editingCoupon}
        onCancel={() => setFormMode('list')}
        onSaved={() => {
          setFormMode('list');
          setEditingCoupon(null);
          loadCoupons();
        }}
      />
    );
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex justify-end">
        <button className={primaryButtonClass} onClick={() => { setEditingCoupon(null); setFormMode('form'); }}>
          <Plus size={18} /> Add coupon
        </button>
      </div>

      <TableToolbar>
        <input className={inputClass} placeholder="Search coupons" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <BrandedSelect
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
        <BrandedSelect
          value={typeFilter}
          onChange={(value) => { setTypeFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All types' },
            ...discountTypeOptions,
          ]}
        />
      </TableToolbar>

      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Code" active={sortKey === 'code'} direction={sortDirection} onSort={() => updateSort('code')} />
              <SortHeader label="Discount" active={sortKey === 'discount'} direction={sortDirection} onSort={() => updateSort('discount')} />
              <SortHeader label="Minimum" active={sortKey === 'minimum'} direction={sortDirection} onSort={() => updateSort('minimum')} />
              <SortHeader label="Usage" active={sortKey === 'usage'} direction={sortDirection} onSort={() => updateSort('usage')} />
              <SortHeader label="Status" active={sortKey === 'status'} direction={sortDirection} onSort={() => updateSort('status')} />
              <SortHeader label="Expires" active={sortKey === 'expires'} direction={sortDirection} onSort={() => updateSort('expires')} />
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={limit} columns={7} />
            ) : coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className={tdClass}><strong>{coupon.code}</strong><span className="mt-1 block text-xs text-stone-500">{coupon.description || '-'}</span></td>
                <td className={tdClass}>{coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `₹${Number(coupon.discount_value).toFixed(2)}`}</td>
                <td className={tdClass}>₹{Number(coupon.min_order_amount || 0).toFixed(2)}</td>
                <td className={tdClass}>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
                <td className={tdClass}><button className={`rounded-lg px-2 py-1 text-xs font-extrabold ${coupon.is_active ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'}`} onClick={() => setCouponToToggle(coupon)}>{coupon.is_active ? 'Active' : 'Disabled'}</button></td>
                <td className={tdClass}>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}</td>
                <td className={tdClass}><button className={iconButtonClass} onClick={() => { setEditingCoupon(coupon); setFormMode('form'); }}><Edit size={16} /></button></td>
              </tr>
            ))}
            {!loading && !coupons.length && (
              <tr>
                <td colSpan={7} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No coupons match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} />
      <ConfirmationModal
        open={!!couponToToggle}
        onClose={() => setCouponToToggle(null)}
        onConfirm={async () => {
          if (couponToToggle) await toggleActive(couponToToggle);
        }}
        title={couponToToggle?.is_active ? 'Disable coupon?' : 'Enable coupon?'}
        message={couponToToggle?.is_active ? `Customers will no longer be able to use "${couponToToggle.code}".` : `Customers will be able to use "${couponToToggle?.code}" again if it is valid.`}
        confirmText={couponToToggle?.is_active ? 'Disable' : 'Enable'}
        variant={couponToToggle?.is_active ? 'warning' : 'info'}
      />
    </section>
  );
}
