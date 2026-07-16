import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, X } from 'lucide-react';
import api from '../api/client';
import { BrandedSelect, iconButtonClass, inputClass, Pagination, panelClass, secondaryButtonClass, SortDirection, SortHeader, tableClass, TableSkeletonRows, TableToolbar, tdClass, thClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Order } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const orderStatusOptions = orderStatuses.map((status) => ({ value: status, label: status }));

const money = (value: string | number | undefined) => `₹${Number(value || 0).toFixed(2)}`;
const dateTime = (value: string | undefined) => value ? new Date(value).toLocaleString() : '-';
const statusBadge = (value: string) => {
  const tone = value === 'delivered' || value === 'paid'
    ? 'bg-emerald-100 text-emerald-800'
    : value === 'cancelled' || value === 'failed'
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800';
  return `inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${tone}`;
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-900/10 py-2 last:border-b-0">
      <span className="text-sm font-bold text-stone-500">{label}</span>
      <strong className="max-w-[65%] break-words text-right text-sm text-stone-900">{value || '-'}</strong>
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onOrderUpdate,
  onRefund,
}: {
  order: Order;
  onClose: () => void;
  onOrderUpdate: (id: string, payload: Record<string, string>) => void;
  onRefund: (order: Order) => void;
}) {
  const subtotal = order.subtotal_price || order.total_price;
  const discount = Number(order.discount_amount || 0);
  const [fulfillment, setFulfillment] = useState({
    status: order.status,
    courier_name: order.courier_name || '',
    tracking_number: order.tracking_number || '',
    estimated_delivery_date: order.estimated_delivery_date ? order.estimated_delivery_date.slice(0, 10) : '',
    admin_notes: order.admin_notes || '',
    note: '',
  });

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-stone-950/55 p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="h-full w-full overflow-y-auto bg-stone-50 shadow-2xl sm:max-w-5xl sm:rounded-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-900/10 bg-stone-50/95 p-5 backdrop-blur">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Order details</p>
            <h2 className="m-0 text-2xl font-black tracking-tight text-stone-900">#{order.id.slice(0, 8)}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">{dateTime(order.created_at)}</p>
          </div>
          <button className={secondaryButtonClass} onClick={onClose}>
            <X size={18} /> Close
          </button>
        </header>

        <div className="grid gap-5 p-5">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Final total</p>
              <strong className="text-2xl font-black text-emerald-950">{money(order.total_price)}</strong>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Order status</p>
              <span className={statusBadge(order.status)}>{order.status}</span>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Payment</p>
              <span className={statusBadge(order.payment_status)}>{order.payment_status}</span>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Coupon</p>
              <strong className="text-lg font-black text-stone-900">{order.coupon_code || 'None'}</strong>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="m-0 text-xl font-black tracking-tight">Items</h3>
                <span className="text-sm font-extrabold text-stone-500">{order.items?.length || 0} line items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass}>Product</th>
                      <th className={thClass}>Qty</th>
                      <th className={thClass}>Unit price</th>
                      <th className={thClass}>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className={tdClass}>{item.product_name}</td>
                        <td className={tdClass}>{item.quantity}</td>
                        <td className={tdClass}>{money(item.price)}</td>
                        <td className={tdClass}>{money(Number(item.price) * item.quantity)}</td>
                      </tr>
                    ))}
                    {!order.items?.length && (
                      <tr>
                        <td className={`${tdClass} py-7 text-center font-extrabold text-stone-500`} colSpan={4}>No items found for this order.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
                <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Amount breakdown</h3>
                <InfoRow label="Subtotal" value={money(subtotal)} />
                <InfoRow label="Coupon code" value={order.coupon_code || '-'} />
                <InfoRow label="Discount" value={discount ? `-${money(discount)}` : money(0)} />
                <InfoRow label="Final total" value={money(order.total_price)} />
              </div>

              <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
                <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Status control</h3>
                <div className="grid gap-3">
                  <BrandedSelect value={fulfillment.status} onChange={(value) => setFulfillment((current) => ({ ...current, status: value }))} options={orderStatusOptions} />
                  <input className={inputClass} placeholder="Courier name" value={fulfillment.courier_name} onChange={(event) => setFulfillment((current) => ({ ...current, courier_name: event.target.value }))} />
                  <input className={inputClass} placeholder="Tracking number" value={fulfillment.tracking_number} onChange={(event) => setFulfillment((current) => ({ ...current, tracking_number: event.target.value }))} />
                  <input className={inputClass} type="date" value={fulfillment.estimated_delivery_date} onChange={(event) => setFulfillment((current) => ({ ...current, estimated_delivery_date: event.target.value }))} />
                  <textarea className={`${inputClass} min-h-24 resize-y`} placeholder="Internal admin notes" value={fulfillment.admin_notes} onChange={(event) => setFulfillment((current) => ({ ...current, admin_notes: event.target.value }))} />
                  <input className={inputClass} placeholder="Customer status note" value={fulfillment.note} onChange={(event) => setFulfillment((current) => ({ ...current, note: event.target.value }))} />
                  <button className={secondaryButtonClass} onClick={() => onOrderUpdate(order.id, fulfillment)}>
                    Save fulfillment
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Customer</h3>
              <InfoRow label="Name" value={order.user_name} />
              <InfoRow label="Email" value={order.user_email} />
            </div>

            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Shipping address</h3>
              <InfoRow label="Name" value={order.shipping_address?.name || order.user_name} />
              <InfoRow label="Address" value={order.shipping_address?.address} />
              <InfoRow label="City" value={order.shipping_address?.city} />
              <InfoRow label="Postal code" value={order.shipping_address?.postalCode} />
              <InfoRow label="Phone" value={order.shipping_address?.phone} />
              <InfoRow label="State" value={order.shipping_address?.state} />
              <InfoRow label="Country" value={order.shipping_address?.country} />
              <InfoRow label="Landmark" value={order.shipping_address?.landmark} />
            </div>

            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Payment details</h3>
              <InfoRow label="Provider" value={order.payment_provider} />
              <InfoRow label="Reference" value={order.payment_reference} />
              <InfoRow label="Razorpay order" value={order.razorpay_order_id} />
              <InfoRow label="Razorpay payment" value={order.razorpay_payment_id} />
            </div>
          </section>

          <section className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
            <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Status history</h3>
            <div className="grid gap-3">
              {(order.status_history || []).map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-900/10 bg-stone-50 p-3">
                  <strong className="text-sm uppercase text-stone-900">
                    {item.from_status || 'created'} → {item.to_status}
                  </strong>
                  <p className="mt-1 text-xs font-bold text-stone-500">{dateTime(item.created_at)}</p>
                  {item.note && <p className="mt-2 text-sm text-stone-700">{item.note}</p>}
                </div>
              ))}
              {!order.status_history?.length && (
                <p className="text-sm font-bold text-stone-500">No status history yet.</p>
              )}
            </div>
          </section>

          {order.status === 'cancelled' && order.payment_status === 'paid' && (
            <section className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
              <h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-red-900">Refund required</h3>
              <p className="mb-4 text-sm font-bold text-red-700">This paid order is cancelled. Mark it refunded after processing the refund.</p>
              <button className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700" onClick={() => onRefund(order)}>
                Mark refunded
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [couponFilter, setCouponFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'id' | 'customer' | 'total' | 'payment' | 'coupon' | 'status'>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusChange, setStatusChange] = useState<{ order: Order; payload: Record<string, string> } | null>(null);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: sortKey === 'id' ? 'created_at' : sortKey === 'total' ? 'total_price' : sortKey === 'payment' ? 'payment_status' : sortKey === 'coupon' ? 'coupon_code' : sortKey,
        order: sortDirection,
      });
      if (query) params.set('search', query);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
      if (couponFilter !== 'all') params.set('couponStatus', couponFilter);
      const res = await api.get(`${endpoints.admin.orders}?${params.toString()}`);
      setOrders(res.data.orders);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortKey, sortDirection, query, statusFilter, paymentFilter, couponFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (id: string, payload: Record<string, string>) => {
    try {
      await api.put(endpoints.orders.status(id), payload);
      toast.success('Order updated');
      await loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update order');
    }
  };

  const requestOrderUpdate = (order: Order, payload: Record<string, string>) => {
    if (payload.status === 'cancelled' && order.status !== 'cancelled') {
      setStatusChange({ order, payload });
      return;
    }
    updateStatus(order.id, payload);
  };

  const markRefunded = async () => {
    if (!refundTarget) return;
    try {
      await api.put(endpoints.orders.refund(refundTarget.id), { note: 'Refund processed by admin' });
      toast.success('Order marked refunded');
      await loadOrders();
      setExpandedOrderId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to mark refunded');
    } finally {
      setRefundTarget(null);
    }
  };

  const updateSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'id' ? 'desc' : 'asc');
  };

  return (
    <section className={panelClass}>
      <TableToolbar>
        <input className={inputClass} placeholder="Search orders" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <BrandedSelect
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setPage(1); }}
          options={[{ value: 'all', label: 'All statuses' }, ...orderStatusOptions]}
        />
        <BrandedSelect
          value={paymentFilter}
          onChange={(value) => { setPaymentFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All payments' },
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'failed', label: 'Failed' },
          ]}
        />
        <BrandedSelect
          value={couponFilter}
          onChange={(value) => { setCouponFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All coupons' },
            { value: 'with', label: 'With coupon' },
            { value: 'without', label: 'No coupon' },
          ]}
        />
      </TableToolbar>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Order" active={sortKey === 'id'} direction={sortDirection} onSort={() => updateSort('id')} />
              <SortHeader label="Customer" active={sortKey === 'customer'} direction={sortDirection} onSort={() => updateSort('customer')} />
              <SortHeader label="Total" active={sortKey === 'total'} direction={sortDirection} onSort={() => updateSort('total')} />
              <SortHeader label="Payment" active={sortKey === 'payment'} direction={sortDirection} onSort={() => updateSort('payment')} />
              <SortHeader label="Coupon" active={sortKey === 'coupon'} direction={sortDirection} onSort={() => updateSort('coupon')} />
              <SortHeader label="Status" active={sortKey === 'status'} direction={sortDirection} onSort={() => updateSort('status')} />
              <th className={thClass}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={limit} columns={7} />
            ) : orders.map((order) => (
              <Fragment key={order.id}>
                <tr>
                  <td className={tdClass}>
                    <button className="bg-transparent p-0 font-extrabold text-emerald-700" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                      {order.id.slice(0, 8)}
                    </button>
                  </td>
                  <td className={tdClass}>
                    <strong>{order.user_name}</strong>
                    <span className="mt-1 block text-xs text-stone-500">{order.user_email}</span>
                  </td>
                  <td className={tdClass}>₹{parseFloat(order.total_price).toFixed(2)}</td>
                  <td className={tdClass}>
                    <strong>{order.payment_status}</strong>
                    <span className="mt-1 block text-xs text-stone-500">{order.payment_provider || '-'}</span>
                  </td>
                  <td className={tdClass}>{order.coupon_code ? `${order.coupon_code} (-₹${parseFloat(order.discount_amount || '0').toFixed(2)})` : '-'}</td>
                  <td className={tdClass}>
                    <BrandedSelect value={order.status} onChange={(value) => requestOrderUpdate(order, { status: value })} options={orderStatusOptions} />
                  </td>
                  <td className={tdClass}>
                    <button className={iconButtonClass} title="View order details" onClick={() => setExpandedOrderId(order.id)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              </Fragment>
            ))}
            {!loading && !orders.length && (
              <tr>
                <td colSpan={7} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No orders match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} />
      {expandedOrderId && orders.find((order) => order.id === expandedOrderId) && (
        <OrderDetailsModal
          order={orders.find((order) => order.id === expandedOrderId)!}
          onClose={() => setExpandedOrderId(null)}
          onOrderUpdate={(id, payload) => {
            const order = orders.find((item) => item.id === id);
            if (order) requestOrderUpdate(order, payload);
          }}
          onRefund={setRefundTarget}
        />
      )}
      <ConfirmationModal
        open={!!statusChange}
        onClose={() => setStatusChange(null)}
        onConfirm={async () => {
          if (statusChange) await updateStatus(statusChange.order.id, statusChange.payload);
        }}
        title="Cancel order?"
        message={statusChange ? `Order #${statusChange.order.id.slice(0, 8)} will be marked as cancelled.` : 'This order will be cancelled.'}
        confirmText="Cancel order"
        variant="danger"
      />
      <ConfirmationModal
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={markRefunded}
        title="Mark refunded?"
        message={refundTarget ? `Order #${refundTarget.id.slice(0, 8)} payment status will change to refunded.` : 'This payment will be marked refunded.'}
        confirmText="Mark refunded"
        variant="warning"
      />
    </section>
  );
}
