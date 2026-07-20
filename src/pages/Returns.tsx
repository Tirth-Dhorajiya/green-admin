import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, Eye, PackageCheck, RefreshCw, RotateCcw, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { BrandedSelect, inputClass, panelClass, primaryButtonClass, secondaryButtonClass, tableClass, tdClass, thClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import type { ReturnRequest } from '../types';

const statuses = ['requested', 'approved', 'reverse_pending', 'reverse_in_transit', 'received', 'resolution_pending', 'resolved', 'rejected', 'cancelled', 'exception'];
const moneyPaise = (value: string | number | undefined) => `₹${(Number(value || 0) / 100).toFixed(2)}`;
const dateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
const badge = (status: string) => `inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
  ['resolved', 'processed', 'delivered', 'returned'].includes(status) ? 'bg-emerald-100 text-emerald-800'
    : ['rejected', 'cancelled', 'failed', 'exception'].includes(status) ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800'
}`;

const defaultParcel = { weight_grams: 500, length_cm: 20, width_cm: 20, height_cm: 20, contents: 'Returned Green Store items' };

function ReturnDetails({ request, onClose, onReload }: { request: ReturnRequest; onClose: () => void; onReload: () => Promise<void> }) {
  const [parcel, setParcel] = useState(defaultParcel);
  const [reason, setReason] = useState('Reviewed by admin');
  const [reverseRequired, setReverseRequired] = useState(request.reverse_required !== false);
  const [busy, setBusy] = useState('');

  const refresh = async () => { await onReload(); };
  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    try { setBusy(key); await action(); toast.success(success); await refresh(); }
    catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Action failed'); }
    finally { setBusy(''); }
  };
  const parcelPayload = { packages: [{ ...parcel, weight_grams: Number(parcel.weight_grams), length_cm: Number(parcel.length_cm), width_cm: Number(parcel.width_cm), height_cm: Number(parcel.height_cm) }] };

  const downloadLabel = async (shipmentId: string, packageId: string, waybill?: string) => {
    try {
      const response = await api.get(endpoints.shipments.label(shipmentId, packageId), { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `delhivery-${waybill || packageId}.pdf`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to download label'); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-stone-950/60 p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="h-full w-full overflow-y-auto bg-stone-50 shadow-2xl sm:max-w-6xl sm:rounded-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-900/10 bg-stone-50/95 p-5 backdrop-blur">
          <div><p className="mb-1 text-xs font-black uppercase tracking-widest text-emerald-700">Return workflow</p><h2 className="m-0 text-2xl font-black">{request.request_number}</h2><p className="mt-1 text-sm font-bold text-stone-500">Order #{request.order_id.slice(0, 8)} · {dateTime(request.created_at)}</p></div>
          <button className={secondaryButtonClass} onClick={onClose}><X size={18} /> Close</button>
        </header>

        <div className="grid gap-5 p-5">
          <section className="grid gap-4 md:grid-cols-4">
            {[['Status', request.status], ['Inspection', request.inspection_status], ['Requested', moneyPaise(request.items.reduce((sum, item) => sum + Number(item.requested_amount_paise), 0))], ['Preference', request.preferred_resolution]].map(([label, value]) => (
              <article key={label} className="rounded-lg border border-stone-900/10 bg-white p-4"><p className="mb-2 text-xs font-black uppercase tracking-widest text-stone-500">{label}</p><strong className="capitalize">{value}</strong></article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-stone-900/10 bg-white p-5">
              <h3 className="mt-0 text-xl font-black">Requested items</h3>
              <div className="grid gap-3">{request.items.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg border border-stone-900/10 bg-stone-50 p-4 sm:grid-cols-[1fr_auto]">
                  <div><strong>{item.product_name}</strong><p className="my-1 text-sm font-bold text-stone-500">{item.reason.replaceAll('_', ' ')} · {item.category}</p><p className="m-0 text-xs text-stone-500">Requested {item.quantity} · Approved {item.approved_quantity} · Received {item.received_quantity} · Accepted {item.accepted_quantity} · Refund {item.refund_quantity} · Replacement {item.replacement_quantity}</p></div>
                  <strong className="text-emerald-800">{moneyPaise(item.requested_amount_paise)}</strong>
                </div>
              ))}</div>
              {request.explanation && <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm font-bold text-amber-900">{request.explanation}</p>}
            </div>
            <div className="rounded-lg border border-stone-900/10 bg-white p-5"><h3 className="mt-0 text-xl font-black">Evidence</h3><div className="grid grid-cols-2 gap-3">{request.evidence.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><img className="aspect-square w-full rounded-lg object-cover" src={item.url} alt="Return evidence" /></a>)}</div>{!request.evidence.length && <p className="text-sm font-bold text-stone-500">No evidence attached.</p>}</div>
          </section>

          {request.status === 'requested' && (
            <section className="rounded-lg border border-emerald-900/10 bg-emerald-50 p-5">
              <h3 className="mt-0 text-xl font-black">Review request</h3>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Decision reason" />
                <label className="flex items-center gap-2 rounded-lg bg-white px-4 text-sm font-extrabold"><input type="checkbox" checked={reverseRequired} onChange={(event) => setReverseRequired(event.target.checked)} /> Reverse pickup</label>
                <button disabled={!!busy} className={primaryButtonClass} onClick={() => run('approve', () => api.post(endpoints.admin.returnDecision(request.id), { decision: 'approved', reason, reverse_required: reverseRequired, items: request.items.map((item) => ({ id: item.id, approved_quantity: item.quantity })) }), 'Return approved')}><CheckCircle2 size={17} /> Approve</button>
              </div>
              <button disabled={!!busy || !reason.trim()} className="mt-3 cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50" onClick={() => window.confirm('Reject this return request?') && run('reject', () => api.post(endpoints.admin.returnDecision(request.id), { decision: 'rejected', reason }), 'Return rejected')}>Reject request</button>
            </section>
          )}

          {request.reverse_required && !request.manual_return && ['approved', 'reverse_pending', 'exception'].includes(request.status) && !request.shipments.some((shipment) => shipment.direction === 'reverse' && shipment.status !== 'failed') && (
            <section className="rounded-lg border border-blue-900/10 bg-blue-50 p-5">
              <h3 className="mt-0 flex items-center gap-2 text-xl font-black"><Truck size={20} /> Create reverse pickup</h3>
              <div className="grid gap-3 sm:grid-cols-5">
                {(['weight_grams', 'length_cm', 'width_cm', 'height_cm'] as const).map((field) => <input key={field} className={inputClass} type="number" min="1" value={parcel[field]} onChange={(event) => setParcel({ ...parcel, [field]: Number(event.target.value) })} placeholder={field.replaceAll('_', ' ')} />)}
                <button disabled={!!busy} className={primaryButtonClass} onClick={() => window.confirm('Create the Delhivery reverse AWB?') && run('reverse', () => api.post(endpoints.admin.returnReverseShipment(request.id), parcelPayload), 'Reverse pickup created')}>Create AWB</button>
              </div>
              <input className={`${inputClass} mt-3`} value={parcel.contents} onChange={(event) => setParcel({ ...parcel, contents: event.target.value })} placeholder="Parcel contents" />
              <button disabled={!!busy} className={`${secondaryButtonClass} mt-3`} onClick={() => window.confirm('Use a manually coordinated courier return instead of Delhivery?') && run('manual', () => api.post(endpoints.admin.returnManual(request.id), { note: 'Manual courier return selected' }), 'Manual return enabled')}>Use manual courier fallback</button>
            </section>
          )}

          {!!request.shipments.length && <section className="rounded-lg border border-stone-900/10 bg-white p-5"><h3 className="mt-0 text-xl font-black">Parcel tracking</h3><div className="grid gap-4">{request.shipments.map((shipment) => <div key={shipment.id} className="rounded-lg border border-stone-900/10 bg-stone-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="capitalize">{shipment.direction} {shipment.purpose}</strong><span className={badge(shipment.status)}>{shipment.status}</span></div>{shipment.packages.map((pkg) => <div key={pkg.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"><div><strong>AWB {pkg.waybill || '-'}</strong><p className="m-0 text-xs font-bold text-stone-500">{pkg.status_description || pkg.status} · {pkg.status_location || '-'}</p></div><div className="flex gap-2"><button className={secondaryButtonClass} onClick={() => run(`sync-${shipment.id}`, () => api.post(endpoints.shipments.sync(shipment.id)), 'Tracking refreshed')}><RefreshCw size={15} /></button>{pkg.waybill && <button className={secondaryButtonClass} onClick={() => downloadLabel(shipment.id, pkg.id, pkg.waybill)}><Download size={15} /> Label</button>}</div></div>)}</div>)}</div></section>}

          {(request.status === 'received' || (request.status === 'approved' && request.manual_return)) && request.inspection_status === 'pending' && (
            <section className="rounded-lg border border-violet-900/10 bg-violet-50 p-5"><h3 className="mt-0 flex items-center gap-2 text-xl font-black"><PackageCheck size={20} /> Warehouse inspection</h3><p className="text-sm font-bold text-violet-800">This records every approved quantity as received and accepted. Non-plant items are restocked.</p><button disabled={!!busy} className={primaryButtonClass} onClick={() => window.confirm('Confirm all approved items passed inspection?') && run('inspect', () => api.post(endpoints.admin.returnInspection(request.id), { items: request.items.map((item) => ({ id: item.id, received_quantity: item.approved_quantity, accepted_quantity: item.approved_quantity, resellable: item.category !== 'plants', condition_note: 'Passed warehouse inspection' })) }), 'Inspection recorded')}>Pass inspected quantities</button></section>
          )}

          {['resolution_pending', 'received', 'exception'].includes(request.status) && (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-900/10 bg-emerald-50 p-5"><h3 className="mt-0 text-xl font-black">Refund</h3><p className="text-sm font-bold text-emerald-800">Refund accepted quantities to the original Razorpay payment method.</p><button disabled={!!busy || request.items.every((item) => (item.accepted_quantity || item.approved_quantity) - item.replacement_quantity <= 0)} className={primaryButtonClass} onClick={() => window.confirm('Initiate this real Razorpay refund? It cannot be undone.') && run('refund', () => api.post(endpoints.admin.returnRefund(request.id), { items: request.items.filter((item) => (item.accepted_quantity || item.approved_quantity) - item.replacement_quantity > 0).map((item) => ({ id: item.id, quantity: (item.accepted_quantity || item.approved_quantity) - item.replacement_quantity })) }), 'Refund initiated')}>Initiate refund</button></div>
              <div className="rounded-lg border border-blue-900/10 bg-blue-50 p-5"><h3 className="mt-0 text-xl font-black">Same-SKU replacement</h3><p className="text-sm font-bold text-blue-800">Inventory is reserved once and a forward Delhivery shipment is created.</p><button disabled={!!busy || request.shipments.some((shipment) => shipment.purpose === 'replacement' && shipment.status !== 'failed') || request.items.every((item) => (item.accepted_quantity || item.approved_quantity) - item.refund_quantity <= 0)} className={primaryButtonClass} onClick={() => window.confirm('Reserve inventory and create the replacement AWB?') && run('replacement', () => api.post(endpoints.admin.returnReplacement(request.id), { items: request.items.filter((item) => (item.accepted_quantity || item.approved_quantity) - item.refund_quantity > 0).map((item) => ({ id: item.id, quantity: (item.accepted_quantity || item.approved_quantity) - item.refund_quantity })), ...parcelPayload }), 'Replacement created')}><RotateCcw size={16} /> Create replacement</button></div>
            </section>
          )}

          {!!request.refunds.length && <section className="rounded-lg border border-stone-900/10 bg-white p-5"><h3 className="mt-0 text-xl font-black">Refunds</h3><div className="grid gap-3">{request.refunds.map((refund) => <div key={refund.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-900/10 p-4"><div><strong>{moneyPaise(refund.amount_paise)}</strong><p className="m-0 text-xs font-bold text-stone-500">{refund.razorpay_refund_id || refund.receipt}{refund.arn ? ` · ARN ${refund.arn}` : ''}</p>{refund.failure_message && <p className="mt-1 text-xs font-bold text-red-700">{refund.failure_message}</p>}</div><div className="flex items-center gap-2"><span className={badge(refund.status)}>{refund.status}</span>{refund.razorpay_refund_id && <button className={secondaryButtonClass} onClick={() => run(`refund-${refund.id}`, () => api.post(endpoints.admin.refreshRefund(refund.id)), 'Refund refreshed')}><RefreshCw size={15} /></button>}{(refund.status === 'failed' || (refund.status === 'pending' && !refund.razorpay_refund_id)) && <button className={secondaryButtonClass} onClick={() => window.confirm('Retry this refund safely with its existing idempotency key?') && run(`retry-${refund.id}`, () => api.post(endpoints.admin.retryRefund(refund.id)), 'Refund retried')}>Retry</button>}</div></div>)}</div></section>}

          <section className="rounded-lg border border-stone-900/10 bg-white p-5"><h3 className="mt-0 text-xl font-black">Audit timeline</h3><div className="grid gap-3">{request.history.map((event) => <div key={event.id} className="rounded-lg border border-stone-900/10 bg-stone-50 p-3"><strong className="uppercase">{event.from_status || 'created'} → {event.to_status}</strong><p className="my-1 text-xs font-bold text-stone-500">{dateTime(event.created_at)}</p>{event.note && <p className="m-0 text-sm">{event.note}</p>}</div>)}</div></section>
        </div>
      </div>
    </div>
  );
}

export function Returns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [linkOrderId, setLinkOrderId] = useState('');
  const [linkRefundId, setLinkRefundId] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const response = await api.get(`${endpoints.admin.returns}?${params}`);
      setReturns(response.data.returns);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load returns'); }
    finally { setLoading(false); }
  }, [status, search]);

  const reloadAll = async () => {
    await load();
    if (selected?.id) {
      const detail = await api.get(endpoints.admin.returnDetail(selected.id));
      setSelected(detail.data.return);
    }
  };

  useEffect(() => { load(); }, [load]);
  const open = async (id: string) => { try { const response = await api.get(endpoints.admin.returnDetail(id)); setSelected(response.data.return); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load return'); } };
  const linkDashboardRefund = async () => {
    try { await api.post(endpoints.admin.linkRefund, { order_id: linkOrderId, razorpay_refund_id: linkRefundId }); toast.success('Verified Razorpay refund linked'); setLinkOrderId(''); setLinkRefundId(''); await load(); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Unable to link refund'); }
  };

  return <section className={panelClass}>
    <div className="mb-5 rounded-lg border border-stone-900/10 bg-stone-50 p-4"><p className="mb-3 text-sm font-black text-stone-800">Link a refund created in Razorpay Dashboard</p><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input className={inputClass} value={linkOrderId} onChange={(event) => setLinkOrderId(event.target.value)} placeholder="Full order UUID" /><input className={inputClass} value={linkRefundId} onChange={(event) => setLinkRefundId(event.target.value)} placeholder="rfnd_..." /><button disabled={!linkOrderId || !linkRefundId} className={secondaryButtonClass} onClick={linkDashboardRefund}>Verify & link</button></div></div>
    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]"><input className={inputClass} placeholder="Search return, order, customer" value={search} onChange={(event) => setSearch(event.target.value)} /><BrandedSelect value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...statuses.map((value) => ({ value, label: value.replaceAll('_', ' ') }))]} /><button className={secondaryButtonClass} onClick={load}><RefreshCw size={16} /> Refresh</button></div>
    <div className="overflow-x-auto"><table className={tableClass}><thead><tr><th className={thClass}>Return</th><th className={thClass}>Customer</th><th className={thClass}>Order</th><th className={thClass}>Amount</th><th className={thClass}>Preference</th><th className={thClass}>Status</th><th className={thClass}>Details</th></tr></thead><tbody>{returns.map((request) => <tr key={request.id}><td className={tdClass}><strong>{request.request_number}</strong><span className="mt-1 block text-xs text-stone-500">{dateTime(request.created_at)}</span></td><td className={tdClass}><strong>{request.customer_name}</strong><span className="block text-xs text-stone-500">{request.customer_email}</span></td><td className={tdClass}>#{request.order_id.slice(0, 8)}</td><td className={tdClass}>{moneyPaise(request.requested_amount_paise)}</td><td className={`${tdClass} capitalize`}>{request.preferred_resolution}</td><td className={tdClass}><span className={badge(request.status)}>{request.status.replaceAll('_', ' ')}</span></td><td className={tdClass}><button className={secondaryButtonClass} onClick={() => open(request.id)}><Eye size={16} /> Open</button></td></tr>)}{!loading && !returns.length && <tr><td className={`${tdClass} py-8 text-center font-bold text-stone-500`} colSpan={7}>No returns match these filters.</td></tr>}</tbody></table></div>
    {selected && <ReturnDetails request={selected} onClose={() => setSelected(null)} onReload={reloadAll} />}
  </section>;
}
