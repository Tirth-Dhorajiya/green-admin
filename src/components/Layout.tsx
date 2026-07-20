import { BadgePercent, BarChart3, Boxes, MessageSquare, RotateCcw, Settings, ShoppingBag, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

export type AdminView = 'dashboard' | 'products' | 'orders' | 'returns' | 'customers' | 'reviews' | 'coupons' | 'settings';

const navItems: Array<{ id: AdminView; label: string; icon: typeof BarChart3 }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'coupons', label: 'Coupons', icon: BadgePercent },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({
  activeView,
  onViewChange,
  children,
}: {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,78,59,0.12),transparent_32rem)] text-stone-900 lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="border-r border-white/10 bg-gradient-to-b from-emerald-950 to-stone-900 p-4 text-emerald-50 lg:p-6">
        <div className="mb-4 flex items-center gap-2 px-2 font-black tracking-tight lg:mb-7">
          <Star size={24} />
          <span>Green Admin</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex min-w-28 flex-none items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-extrabold transition lg:w-full lg:justify-start ${activeView === id ? 'bg-emerald-500/20 text-white' : 'text-emerald-50/75 hover:bg-emerald-500/15 hover:text-white'}`}
              onClick={() => onViewChange(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 p-4 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Admin workspace</p>
            <h1 className="m-0 text-3xl font-black tracking-tight text-stone-900 lg:text-4xl">{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-stone-500 lg:justify-end">
            <span>{user?.name}</span>
            <button className="cursor-pointer rounded-lg bg-emerald-500/10 px-4 py-2.5 font-extrabold text-emerald-950 transition hover:bg-emerald-500/20" onClick={() => setLogoutOpen(true)}>Logout</button>
          </div>
        </header>
        {children}
      </main>
      <ConfirmationModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
        title="Logout?"
        message="You will need to sign in again before managing the admin panel."
        confirmText="Logout"
        variant="warning"
      />
    </div>
  );
}
