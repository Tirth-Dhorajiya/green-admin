import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { inputClass, PageSizeSelect, Pagination, panelClass, selectClass, SortDirection, SortHeader, tableClass, TableToolbar, tdClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Order } from '../types';

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

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

  const loadOrders = useCallback(async () => {
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
  }, [page, limit, sortKey, sortDirection, query, statusFilter, paymentFilter, couponFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (id: string, status: string) => {
    await api.put(endpoints.orders.status(id), { status });
    toast.success('Order status updated');
    loadOrders();
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
        <select className={selectClass} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className={selectClass} value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }}>
          <option value="all">All payments</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
        </select>
        <select className={selectClass} value={couponFilter} onChange={(event) => { setCouponFilter(event.target.value); setPage(1); }}>
          <option value="all">All coupons</option>
          <option value="with">With coupon</option>
          <option value="without">No coupon</option>
        </select>
        <PageSizeSelect value={limit} onChange={(value) => { setLimit(value); setPage(1); }} />
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
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
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
                  <td className={tdClass}>Rs. {parseFloat(order.total_price).toFixed(2)}</td>
                  <td className={tdClass}>
                    <strong>{order.payment_status}</strong>
                    <span className="mt-1 block text-xs text-stone-500">{order.payment_provider || '-'}</span>
                  </td>
                  <td className={tdClass}>{order.coupon_code ? `${order.coupon_code} (-Rs. ${parseFloat(order.discount_amount || '0').toFixed(2)})` : '-'}</td>
                  <td className={tdClass}>
                    <select className={selectClass} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <td className={tdClass} colSpan={6}>
                      <div className="grid grid-cols-1 gap-5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 md:grid-cols-2">
                        <div>
                          <h3 className="mb-2 font-black">Shipping</h3>
                          <p className="my-1 text-sm text-stone-600">{order.shipping_address?.name || order.user_name}</p>
                          <p className="my-1 text-sm text-stone-600">{order.shipping_address?.address || '-'}</p>
                          <p className="my-1 text-sm text-stone-600">{[order.shipping_address?.city, order.shipping_address?.postalCode].filter(Boolean).join(' ') || '-'}</p>
                          <p className="my-1 text-sm text-stone-600">Payment ref: {order.payment_reference || '-'}</p>
                        </div>
                        <div>
                          <h3 className="mb-2 font-black">Items</h3>
                          {(order.items || []).map((item) => (
                            <p className="my-1 text-sm text-stone-600" key={item.id}>{item.quantity} x {item.product_name} at Rs. {parseFloat(item.price).toFixed(2)}</p>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No orders match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
