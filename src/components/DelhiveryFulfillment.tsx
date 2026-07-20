import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle, Download, PackagePlus, Plus, RefreshCw, Trash2, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { Order, Shipment } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { inputClass, secondaryButtonClass } from './TableTools';

type PackageDraft = {
  weight_grams: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  contents: string;
};

const emptyPackage = (contents = ''): PackageDraft => ({
  weight_grams: '500',
  length_cm: '20',
  width_cm: '20',
  height_cm: '20',
  contents,
});

const dateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10);

export function DelhiveryFulfillment({ order, onChanged }: { order: Order; onChanged: () => Promise<void> }) {
  const defaultContents = useMemo(
    () => (order.items || []).map((item) => `${item.quantity} x ${item.product_name}`).join(', ').slice(0, 500),
    [order.items]
  );
  const [packages, setPackages] = useState<PackageDraft[]>([emptyPackage(defaultContents)]);
  const [ewaybillNumber, setEwaybillNumber] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Shipment | null>(null);

  useEffect(() => setPackages([emptyPackage(defaultContents)]), [order.id, defaultContents]);

  const createShipment = async () => {
    try {
      setBusy('create');
      await api.post(endpoints.orders.createShipment(order.id), {
        ewaybill_number: ewaybillNumber || undefined,
        packages: packages.map((pkg) => ({
          weight_grams: Number(pkg.weight_grams),
          length_cm: Number(pkg.length_cm),
          width_cm: Number(pkg.width_cm),
          height_cm: Number(pkg.height_cm),
          contents: pkg.contents.trim(),
        })),
      });
      toast.success('Delhivery shipment created');
      await onChanged();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to create Delhivery shipment');
    } finally {
      setBusy(null);
    }
  };

  const syncShipment = async (shipmentId: string) => {
    try {
      setBusy(`sync-${shipmentId}`);
      await api.post(endpoints.shipments.sync(shipmentId));
      toast.success('Tracking synchronized');
      await onChanged();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to refresh tracking');
    } finally {
      setBusy(null);
    }
  };

  const cancelShipment = async () => {
    if (!cancelTarget) return;
    try {
      setBusy(`cancel-${cancelTarget.id}`);
      await api.post(endpoints.shipments.cancel(cancelTarget.id));
      toast.success('Shipment cancelled');
      await onChanged();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to cancel shipment');
    } finally {
      setBusy(null);
    }
  };

  const downloadLabel = async (shipmentId: string, packageId: string, waybill?: string) => {
    try {
      setBusy(`label-${packageId}`);
      const response = await api.get(endpoints.shipments.label(shipmentId, packageId), { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: String(response.headers['content-type'] || 'application/pdf') }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `delhivery-${waybill || packageId}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Label is not available yet');
    } finally {
      setBusy(null);
    }
  };

  const activeShipment = (order.shipments || []).find((shipment) => ['creating', 'manifested', 'in_transit', 'partial'].includes(shipment.status));
  const invalidPackage = packages.some((pkg) => !pkg.contents.trim() || [pkg.weight_grams, pkg.length_cm, pkg.width_cm, pkg.height_cm].some((value) => Number(value) <= 0));

  return (
    <section className="rounded-lg border border-emerald-900/10 bg-emerald-50/60 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Delhivery B2C</p>
          <h3 className="mb-0 mt-1 text-xl font-black tracking-tight text-emerald-950">Shipment and AWBs</h3>
        </div>
        <Truck className="text-emerald-700" size={26} />
      </div>

      {!activeShipment && order.payment_status === 'paid' && ['pending', 'processing'].includes(order.status) && (
        <div className="mb-5 grid gap-4">
          {Number(order.total_price) >= 50000 && (
            <label className="block text-xs font-extrabold uppercase tracking-wide text-stone-500">
              E-waybill number
              <input className={`${inputClass} mt-1`} inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={ewaybillNumber} onChange={(event) => setEwaybillNumber(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit e-waybill" />
            </label>
          )}
          {packages.map((pkg, index) => (
            <div key={index} className="rounded-lg border border-emerald-900/10 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong>Parcel {index + 1}</strong>
                {packages.length > 1 && (
                  <button className={secondaryButtonClass} onClick={() => setPackages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                    <X size={15} /> Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {([
                  ['weight_grams', 'Weight (g)'],
                  ['length_cm', 'Length (cm)'],
                  ['width_cm', 'Width (cm)'],
                  ['height_cm', 'Height (cm)'],
                ] as const).map(([field, label]) => (
                  <label key={field} className="text-xs font-extrabold uppercase tracking-wide text-stone-500">
                    {label}
                    <input className={`${inputClass} mt-1`} type="number" min="0.01" step="0.01" value={pkg[field]} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item))} />
                  </label>
                ))}
              </div>
              <label className="mt-3 block text-xs font-extrabold uppercase tracking-wide text-stone-500">
                Contents
                <input className={`${inputClass} mt-1`} maxLength={500} value={pkg.contents} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, contents: event.target.value } : item))} />
              </label>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button className={secondaryButtonClass} onClick={() => setPackages((current) => [...current, emptyPackage(defaultContents)])} disabled={packages.length >= 20}>
              <Plus size={16} /> Add parcel
            </button>
            <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={createShipment} disabled={busy === 'create' || invalidPackage || (Number(order.total_price) >= 50000 && ewaybillNumber.length !== 12)}>
              <PackagePlus size={17} /> {busy === 'create' ? 'Creating shipment...' : 'Create Delhivery shipment'}
            </button>
          </div>
        </div>
      )}

      {order.payment_status !== 'paid' && !(order.shipments || []).length && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-800">Shipment creation becomes available after payment is marked paid.</p>
      )}

      <div className="grid gap-4">
        {(order.shipments || []).map((shipment) => (
          <article key={shipment.id} className="rounded-lg border border-emerald-900/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong className="block text-sm uppercase text-emerald-900">{shipment.provider_reference}</strong>
                <span className="text-xs font-bold text-stone-500">{shipment.pickup_location} · {dateTime(shipment.manifested_at || shipment.created_at)}</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-800">{shipment.status}</span>
            </div>
            {shipment.failure_message && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{shipment.failure_message}</p>}
            <div className="mt-4 grid gap-3">
              {shipment.packages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border border-stone-900/10 bg-stone-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong>Parcel {pkg.sequence} · {pkg.waybill || 'AWB pending'}</strong>
                      <p className="mb-0 mt-1 text-xs font-bold text-stone-500">{pkg.weight_grams} g · {pkg.length_cm} × {pkg.width_cm} × {pkg.height_cm} cm · {pkg.status.replaceAll('_', ' ')}</p>
                      {(pkg.status_location || pkg.status_description) && <p className="mb-0 mt-1 text-xs text-stone-600">{pkg.status_description} {pkg.status_location ? `· ${pkg.status_location}` : ''}</p>}
                    </div>
                    {pkg.waybill && <button className={secondaryButtonClass} onClick={() => downloadLabel(shipment.id, pkg.id, pkg.waybill)} disabled={busy === `label-${pkg.id}`}><Download size={15} /> Label</button>}
                  </div>
                </div>
              ))}
            </div>
            {['manifested', 'in_transit', 'partial'].includes(shipment.status) && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button className={secondaryButtonClass} onClick={() => syncShipment(shipment.id)} disabled={busy === `sync-${shipment.id}`}><RefreshCw size={15} /> Refresh tracking</button>
                {!shipment.packages.some((pkg) => pkg.status === 'delivered') && <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-700 hover:bg-red-100" onClick={() => setCancelTarget(shipment)}><Trash2 size={15} /> Cancel shipment</button>}
              </div>
            )}
          </article>
        ))}
      </div>

      <ConfirmationModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelShipment} title="Cancel Delhivery shipment?" message={cancelTarget ? `All eligible AWBs in ${cancelTarget.provider_reference} will be cancelled.` : ''} confirmText="Cancel shipment" variant="danger" />
    </section>
  );
}

type Pickup = { id: string; pickup_location: string; pickup_date: string; pickup_time: string; expected_package_count: number; status: string };

export function DelhiveryPickupScheduler() {
  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [count, setCount] = useState('1');
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [busy, setBusy] = useState(false);

  const loadPickups = async () => {
    try {
      const response = await api.get(endpoints.admin.pickups);
      setPickups(response.data.pickups || []);
    } catch {
      // The orders page already surfaces connection errors.
    }
  };

  useEffect(() => { loadPickups(); }, []);

  const schedule = async () => {
    try {
      setBusy(true);
      await api.post(endpoints.admin.pickups, { pickup_date: pickupDate, pickup_time: pickupTime, expected_package_count: Number(count) });
      toast.success('Delhivery pickup scheduled');
      await loadPickups();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to schedule pickup');
    } finally {
      setBusy(false);
    }
  };

  const updatePickup = async (pickupId: string, status: 'completed' | 'cancelled') => {
    try {
      setBusy(true);
      await api.put(endpoints.admin.pickupStatus(pickupId), { status });
      toast.success(`Pickup marked ${status}`);
      await loadPickups();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update pickup');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-5 rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <CalendarClock className="text-emerald-700" size={22} />
        <div><p className="m-0 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Warehouse pickup</p><h2 className="m-0 text-xl font-black">Schedule Delhivery collection</h2></div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input className={inputClass} type="date" min={today} value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
        <input className={inputClass} type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} />
        <input className={inputClass} type="number" min="1" placeholder="Package count" value={count} onChange={(event) => setCount(event.target.value)} />
        <button className={secondaryButtonClass} onClick={schedule} disabled={busy || Number(count) < 1}><Truck size={16} /> {busy ? 'Scheduling...' : 'Schedule pickup'}</button>
      </div>
      {!!pickups.length && (
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {pickups.slice(0, 3).map((pickup) => (
            <div key={pickup.id} className="rounded-lg bg-stone-50 p-3 text-sm">
              <strong>{new Date(pickup.pickup_date).toLocaleDateString()} · {pickup.pickup_time.slice(0, 5)}</strong>
              <p className="mb-0 mt-1 text-xs font-bold text-stone-500">{pickup.expected_package_count} packages · {pickup.status}</p>
              {pickup.status === 'scheduled' && (
                <div className="mt-3 flex gap-2">
                  <button className={secondaryButtonClass} disabled={busy} onClick={() => updatePickup(pickup.id, 'completed')}><CheckCircle size={14} /> Complete</button>
                  <button className={secondaryButtonClass} disabled={busy} onClick={() => updatePickup(pickup.id, 'cancelled')}><X size={14} /> Close</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
