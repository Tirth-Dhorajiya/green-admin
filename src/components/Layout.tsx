import { BadgePercent, BarChart3, Boxes, MessageSquare, Settings, ShoppingBag, Star, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export type AdminView = 'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'coupons' | 'settings';

const navItems: Array<{ id: AdminView; label: string; icon: typeof BarChart3 }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Star size={24} />
          <span>Green Admin</span>
        </div>
        <nav className="nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} onClick={() => onViewChange(id)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="account">
            <span>{user?.name}</span>
            <button className="secondary-button" onClick={logout}>Logout</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
