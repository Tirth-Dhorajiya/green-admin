import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, Save, X } from 'lucide-react';
import api from '../api/client';
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

  const loadCoupons = async () => {
    const res = await api.get(endpoints.admin.coupons);
    setCoupons(res.data.coupons);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

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

  return (
    <section className="panel">
      <form className="form-grid" onSubmit={submit}>
        <label>Code<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required /></label>
        <label>Type<select value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as Coupon['discount_type'] })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></label>
        <label>Discount<input type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} required /></label>
        <label>Minimum order<input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(event) => setForm({ ...form, min_order_amount: event.target.value })} /></label>
        <label>Max discount<input type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={(event) => setForm({ ...form, max_discount_amount: event.target.value })} /></label>
        <label>Usage limit<input type="number" min="1" value={form.usage_limit} onChange={(event) => setForm({ ...form, usage_limit: event.target.value })} /></label>
        <label>Expires<input type="date" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active coupon</label>
        <label className="full">Description<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="full row-actions">
          <button className="primary-button" disabled={saving}><Save size={18} /> {editingCoupon ? 'Update coupon' : 'Create coupon'}</button>
          {editingCoupon && <button type="button" className="secondary-button" onClick={resetForm}><X size={18} /> Cancel edit</button>}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Minimum</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td><strong>{coupon.code}</strong><span>{coupon.description || '-'}</span></td>
                <td>{coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `Rs. ${Number(coupon.discount_value).toFixed(2)}`}</td>
                <td>Rs. {Number(coupon.min_order_amount || 0).toFixed(2)}</td>
                <td>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
                <td><button className={coupon.is_active ? 'chip active' : 'chip'} onClick={() => toggleActive(coupon)}>{coupon.is_active ? 'Active' : 'Disabled'}</button></td>
                <td>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}</td>
                <td><button className="icon-button" onClick={() => startEdit(coupon)}><Edit size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
