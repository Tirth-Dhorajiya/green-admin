import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, X } from 'lucide-react';
import api from '../api/client';
import { BrandedSelect, iconButtonClass, inputClass, Pagination, panelClass, secondaryButtonClass, SortDirection, SortHeader, tableClass, TableToolbar, tdClass, thClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { CustomerDetails, User } from '../types';

const money = (value: string | number | undefined) => `Rs. ${Number(value || 0).toFixed(2)}`;
const dateTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString() : '-';

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

function AddressCard({ title, address }: { title: string; address?: User['address'] }) {
  return (
    <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
      <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">{title}</h3>
      <InfoRow label="Name" value={address?.name} />
      <InfoRow label="Phone" value={address?.phone} />
      <InfoRow label="Address" value={address?.address} />
      <InfoRow label="City" value={address?.city} />
      <InfoRow label="State" value={address?.state} />
      <InfoRow label="Postal code" value={address?.postalCode} />
      <InfoRow label="Country" value={address?.country} />
    </div>
  );
}

function CustomerDetailsDrawer({
  details,
  onClose,
}: {
  details: CustomerDetails;
  onClose: () => void;
}) {
  const { customer, summary, orders } = details;

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-stone-950/55 p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="h-full w-full overflow-y-auto bg-stone-50 shadow-2xl sm:max-w-6xl sm:rounded-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-900/10 bg-stone-50/95 p-5 backdrop-blur">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Customer details</p>
            <h2 className="m-0 text-2xl font-black tracking-tight text-stone-900">{customer.name}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">{customer.email}</p>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            <X size={18} /> Close
          </button>
        </header>

        <div className="grid gap-5 p-5">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Total spent</p>
              <strong className="text-2xl font-black text-emerald-950">{money(summary.totalSpent)}</strong>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Orders</p>
              <strong className="text-2xl font-black text-stone-900">{summary.totalOrders}</strong>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Paid orders</p>
              <strong className="text-2xl font-black text-stone-900">{summary.paidOrders}</strong>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Delivered</p>
              <strong className="text-2xl font-black text-stone-900">{summary.deliveredOrders}</strong>
            </article>
            <article className="rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Discount</p>
              <strong className="text-2xl font-black text-emerald-950">{money(summary.totalDiscount)}</strong>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Profile</h3>
              <InfoRow label="Customer ID" value={customer.id} />
              <InfoRow label="Role" value={customer.role} />
              <InfoRow label="Email verified" value={customer.email_verified ? 'Yes' : 'No'} />
              <InfoRow label="Joined" value={dateTime(customer.created_at)} />
              <InfoRow label="Last order" value={dateTime(summary.lastOrderAt)} />
            </div>
            <AddressCard title="Saved address" address={customer.address} />
            <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
              <h3 className="mb-3 mt-0 text-xl font-black tracking-tight">Latest shipping address</h3>
              {orders[0]?.shipping_address ? (
                <>
                  <InfoRow label="Name" value={orders[0].shipping_address.name} />
                  <InfoRow label="Address" value={orders[0].shipping_address.address} />
                  <InfoRow label="City" value={orders[0].shipping_address.city} />
                  <InfoRow label="Postal code" value={orders[0].shipping_address.postalCode} />
                </>
              ) : (
                <p className="text-sm font-bold text-stone-500">No shipping address found.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="m-0 text-xl font-black tracking-tight">Order history</h3>
              <span className="text-sm font-extrabold text-stone-500">{orders.length} orders</span>
            </div>

            <div className="grid gap-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-xl border border-stone-900/10 bg-stone-50 p-4">
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-500">Order</p>
                      <strong className="text-emerald-700">#{order.id.slice(0, 8)}</strong>
                      <p className="mt-1 text-xs font-bold text-stone-500">{dateTime(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-500">Total</p>
                      <strong>{money(order.total_price)}</strong>
                      <p className="mt-1 text-xs font-bold text-stone-500">Subtotal {money(order.subtotal_price)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-500">Status</p>
                      <span className={statusBadge(order.status)}>{order.status}</span>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-500">Payment</p>
                      <span className={statusBadge(order.payment_status)}>{order.payment_status}</span>
                      <p className="mt-1 text-xs font-bold text-stone-500">{order.payment_provider || '-'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-500">Coupon</p>
                      <strong>{order.coupon_code || '-'}</strong>
                      <p className="mt-1 text-xs font-bold text-stone-500">Discount {money(order.discount_amount)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.7fr]">
                    <div className="overflow-x-auto rounded-lg bg-white">
                      <table className="w-full min-w-[560px] border-collapse">
                        <thead>
                          <tr>
                            <th className={thClass}>Product</th>
                            <th className={thClass}>Qty</th>
                            <th className={thClass}>Price</th>
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
                              <td className={`${tdClass} py-6 text-center font-extrabold text-stone-500`} colSpan={4}>No order items found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-lg bg-white p-4">
                      <h4 className="mb-2 mt-0 text-sm font-black uppercase tracking-widest text-stone-500">Shipping and payment</h4>
                      <InfoRow label="Ship to" value={order.shipping_address?.name} />
                      <InfoRow label="Address" value={order.shipping_address?.address} />
                      <InfoRow label="City" value={order.shipping_address?.city} />
                      <InfoRow label="Postal code" value={order.shipping_address?.postalCode} />
                      <InfoRow label="Payment ref" value={order.payment_reference} />
                      <InfoRow label="Razorpay order" value={order.razorpay_order_id} />
                      <InfoRow label="Razorpay payment" value={order.razorpay_payment_id} />
                    </div>
                  </div>
                </article>
              ))}

              {!orders.length && (
                <div className="rounded-lg border border-dashed border-stone-900/15 bg-stone-50 p-8 text-center font-extrabold text-stone-500">No orders found for this customer.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'role' | 'joined'>('joined');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: sortKey === 'joined' ? 'created_at' : sortKey,
      order: sortDirection,
    });
    if (query) params.set('search', query);
    if (roleFilter !== 'all') params.set('role', roleFilter);

    api.get(`${endpoints.admin.customers}?${params.toString()}`).then((res) => {
      setCustomers(res.data.customers);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
    });
  }, [page, limit, sortKey, sortDirection, query, roleFilter]);

  const openDetails = async (customer: User) => {
    try {
      setDetailsLoadingId(customer.id);
      const res = await api.get(endpoints.admin.customer(customer.id));
      setDetails({
        customer: res.data.customer,
        summary: res.data.summary,
        orders: res.data.orders,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load customer details');
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const updateSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'joined' ? 'desc' : 'asc');
  };

  return (
    <section className={panelClass}>
      <TableToolbar>
        <input className={inputClass} placeholder="Search customers" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <BrandedSelect
          value={roleFilter}
          onChange={(value) => { setRoleFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All roles' },
            { value: 'user', label: 'Customers' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
      </TableToolbar>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Name" active={sortKey === 'name'} direction={sortDirection} onSort={() => updateSort('name')} />
              <SortHeader label="Email" active={sortKey === 'email'} direction={sortDirection} onSort={() => updateSort('email')} />
              <SortHeader label="Role" active={sortKey === 'role'} direction={sortDirection} onSort={() => updateSort('role')} />
              <SortHeader label="Joined" active={sortKey === 'joined'} direction={sortDirection} onSort={() => updateSort('joined')} />
              <th className={thClass}>Details</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className={tdClass}>{customer.name}</td>
                <td className={tdClass}>{customer.email}</td>
                <td className={tdClass}>{customer.role}</td>
                <td className={tdClass}>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
                <td className={tdClass}>
                  <button className={iconButtonClass} disabled={detailsLoadingId === customer.id} title="View customer details" onClick={() => openDetails(customer)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No customers match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} />
      {details && <CustomerDetailsDrawer details={details} onClose={() => setDetails(null)} />}
    </section>
  );
}
