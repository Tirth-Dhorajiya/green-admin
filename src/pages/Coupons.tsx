import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Save, X } from 'lucide-react';
import api from '../api/client';
import { iconButtonClass, inputClass, PageSizeSelect, Pagination, panelClass, primaryButtonClass, secondaryButtonClass, selectClass, SortDirection, SortHeader, tableClass, TableToolbar, tdClass, thClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Coupon } from '../types';

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

export function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'code' | 'discount' | 'minimum' | 'usage' | 'status' | 'expires'>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadCoupons = useCallback(async () => {
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
  }, [page, limit, sortKey, sortDirection, query, statusFilter, typeFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount || '0'),
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      is_active: coupon.is_active,
    });
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
  };

  const payload = {
    ...form,
    code: form.code.toUpperCase(),
    max_discount_amount: form.max_discount_amount || null,
    usage_limit: form.usage_limit || null,
    expires_at: form.expires_at || null,
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (editingCoupon) {
        await api.put(endpoints.admin.coupon(editingCoupon.id), payload);
        toast.success('Coupon updated');
      } else {
        await api.post(endpoints.admin.coupons, payload);
        toast.success('Coupon created');
      }
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save coupon');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <section className={panelClass}>
      <form className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Code<input className={inputClass} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required /></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Type<select className={selectClass} value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as Coupon['discount_type'] })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Discount<input className={inputClass} type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} required /></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Minimum order<input className={inputClass} type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(event) => setForm({ ...form, min_order_amount: event.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Max discount<input className={inputClass} type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={(event) => setForm({ ...form, max_discount_amount: event.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Usage limit<input className={inputClass} type="number" min="1" value={form.usage_limit} onChange={(event) => setForm({ ...form, usage_limit: event.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-stone-600">Expires<input className={inputClass} type="date" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active coupon</label>
        <label className="grid gap-2 text-sm font-bold text-stone-600 md:col-span-2">Description<textarea className={inputClass} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button className={primaryButtonClass} disabled={saving}><Save size={18} /> {editingCoupon ? 'Update coupon' : 'Create coupon'}</button>
          {editingCoupon && <button type="button" className={secondaryButtonClass} onClick={resetForm}><X size={18} /> Cancel edit</button>}
        </div>
      </form>

      <TableToolbar>
        <input className={inputClass} placeholder="Search coupons" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <select className={selectClass} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select className={selectClass} value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}>
          <option value="all">All types</option>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>
        <PageSizeSelect value={limit} onChange={(value) => { setLimit(value); setPage(1); }} />
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
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className={tdClass}><strong>{coupon.code}</strong><span className="mt-1 block text-xs text-stone-500">{coupon.description || '-'}</span></td>
                <td className={tdClass}>{coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `Rs. ${Number(coupon.discount_value).toFixed(2)}`}</td>
                <td className={tdClass}>Rs. {Number(coupon.min_order_amount || 0).toFixed(2)}</td>
                <td className={tdClass}>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
                <td className={tdClass}><button className={`rounded-lg px-2 py-1 text-xs font-extrabold ${coupon.is_active ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'}`} onClick={() => toggleActive(coupon)}>{coupon.is_active ? 'Active' : 'Disabled'}</button></td>
                <td className={tdClass}>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}</td>
                <td className={tdClass}><button className={iconButtonClass} onClick={() => startEdit(coupon)}><Edit size={16} /></button></td>
              </tr>
            ))}
            {!coupons.length && (
              <tr>
                <td colSpan={7} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No coupons match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
