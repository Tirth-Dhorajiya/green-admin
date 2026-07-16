import { useEffect, useState } from 'react';
import { AlertTriangle, BadgePercent, Boxes, IndianRupee, PackagePlus, ShoppingBag, Users } from 'lucide-react';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { Coupon, Order, Product, Stats } from '../types';
import type { AdminView } from '../components/Layout';
import { SkeletonBlock } from '../components/TableTools';

type DashboardData = {
  stats: Stats | null;
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
};

const money = (value: number | string | undefined) => `₹${Number(value || 0).toFixed(2)}`;

export function Dashboard({ onViewChange }: { onViewChange: (view: AdminView) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes, productsRes, couponsRes] = await Promise.all([
          api.get(endpoints.admin.stats),
          api.get(`${endpoints.admin.orders}?limit=5`),
          api.get(`${endpoints.products.list}?limit=100`),
          api.get(`${endpoints.admin.coupons}?limit=100`),
        ]);

        const data: DashboardData = {
          stats: statsRes.data.stats,
          orders: ordersRes.data.orders || [],
          products: productsRes.data.products || [],
          coupons: couponsRes.data.coupons || [],
        };

        setStats(data.stats);
        setOrders(data.orders);
        setProducts(data.products);
        setCoupons(data.coupons);
        setError('');
      } catch {
        setError('Dashboard data could not be loaded. Check backend env and admin login token.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const lowStockProducts = products.filter((product) => product.stock <= 5).slice(0, 5);
  const activeCoupons = coupons.filter((coupon) => coupon.is_active).length;
  const pendingOrders = orders.filter((order) => ['pending', 'processing'].includes(order.status)).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;

  const cards = [
    { label: 'Revenue', value: stats ? money(stats.totalRevenue) : '-', icon: IndianRupee },
    { label: 'Orders', value: stats?.totalOrders ?? '-', icon: ShoppingBag },
    { label: 'Products', value: stats?.totalProducts ?? '-', icon: Boxes },
    { label: 'Customers', value: stats?.totalUsers ?? '-', icon: Users },
  ];

  return (
    <div className="grid gap-5">
      {error && <div className="flex items-center gap-3 rounded-lg border border-red-700/15 bg-red-50 p-4 text-sm font-extrabold text-red-800">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="flex items-start justify-between rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5 transition hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-950/10" key={label}>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">{label}</p>
              {loading ? <SkeletonBlock className="h-8 w-24" /> : <strong className="text-2xl font-black tracking-tight text-stone-900">{value}</strong>}
            </div>
            <Icon className="box-content rounded-lg bg-emerald-500/10 p-2 text-emerald-600" size={26} />
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Today focus</p>
              <h2 className="m-0 text-xl font-black tracking-tight">Store operations</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <button className="grid min-h-32 cursor-pointer content-between justify-items-start gap-3 rounded-lg border border-emerald-500/15 bg-gradient-to-b from-white to-emerald-500/5 p-4 text-left text-stone-900 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/5" onClick={() => onViewChange('products')}>
              <PackagePlus size={22} />
              <span className="text-sm font-bold text-stone-500">Add or edit products</span>
              <strong className="text-lg font-black text-emerald-950">{featuredProducts} featured</strong>
            </button>
            <button className="grid min-h-32 cursor-pointer content-between justify-items-start gap-3 rounded-lg border border-emerald-500/15 bg-gradient-to-b from-white to-emerald-500/5 p-4 text-left text-stone-900 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/5" onClick={() => onViewChange('orders')}>
              <ShoppingBag size={22} />
              <span className="text-sm font-bold text-stone-500">Review orders</span>
              <strong className="text-lg font-black text-emerald-950">{pendingOrders} active</strong>
            </button>
            <button className="grid min-h-32 cursor-pointer content-between justify-items-start gap-3 rounded-lg border border-emerald-500/15 bg-gradient-to-b from-white to-emerald-500/5 p-4 text-left text-stone-900 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/5" onClick={() => onViewChange('coupons')}>
              <BadgePercent size={22} />
              <span className="text-sm font-bold text-stone-500">Manage coupons</span>
              <strong className="text-lg font-black text-emerald-950">{activeCoupons} active</strong>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Inventory</p>
              <h2 className="m-0 text-xl font-black tracking-tight">Low stock</h2>
            </div>
            <button className="cursor-pointer bg-transparent p-0 text-sm font-extrabold text-emerald-700" onClick={() => onViewChange('products')}>View all</button>
          </div>
          {loading ? (
            <div className="grid gap-2.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-16" />)}
            </div>
          ) : lowStockProducts.length ? (
            <div className="grid gap-2.5">
              {lowStockProducts.map((product) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-900/10 p-3" key={product.id}>
                  <div className="min-w-0">
                    <strong className="block truncate">{product.name}</strong>
                    <span className="block truncate text-xs font-bold text-stone-500">{product.category}</span>
                  </div>
                  <b className="flex-none text-sm text-emerald-950">{product.stock} left</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center gap-3 rounded-lg border border-dashed border-emerald-500/30 p-4 text-center text-stone-500">
              <AlertTriangle size={22} />
              <p className="m-0 font-extrabold">No low-stock products yet.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Recent</p>
              <h2 className="m-0 text-xl font-black tracking-tight">Latest orders</h2>
            </div>
            <button className="cursor-pointer bg-transparent p-0 text-sm font-extrabold text-emerald-700" onClick={() => onViewChange('orders')}>Open orders</button>
          </div>
          {loading ? (
            <div className="grid gap-2.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-16" />)}
            </div>
          ) : orders.length ? (
            <div className="grid gap-2.5">
              {orders.slice(0, 5).map((order) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-900/10 p-3" key={order.id}>
                  <div className="min-w-0">
                    <strong className="block truncate">{order.user_name}</strong>
                    <span className="block truncate text-xs font-bold text-stone-500">{order.id.slice(0, 8)} · {order.status}</span>
                  </div>
                  <b className="flex-none text-sm text-emerald-950">{money(order.total_price)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center gap-3 rounded-lg border border-dashed border-emerald-500/30 p-4 text-center text-stone-500">
              <ShoppingBag size={22} />
              <p className="m-0 font-extrabold">No orders yet. New checkout activity will appear here.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Setup</p>
              <h2 className="m-0 text-xl font-black tracking-tight">Launch checklist</h2>
            </div>
          </div>
          <div className="grid gap-2.5">
            {loading && [1, 2, 3, 4].map((item) => <SkeletonBlock key={item} className="h-12" />)}
            {!loading && (
            <>
            {[
              ['Add product catalog', products.length],
              ['Mark featured products', featuredProducts],
              ['Create active coupon', activeCoupons],
              ['Receive first order', orders.length],
            ].map(([label, done]) => (
              <span key={label} className={`relative rounded-lg border py-3 pl-10 pr-3 text-sm font-extrabold ${done ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-950 before:border-emerald-500 before:bg-emerald-500 before:shadow-[inset_0_0_0_3px_#fff]' : 'border-stone-900/10 text-stone-500 before:border-stone-300'} before:absolute before:left-3 before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rounded-full before:border-2 before:content-['']`}>
                {label}
              </span>
            ))}
            </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
