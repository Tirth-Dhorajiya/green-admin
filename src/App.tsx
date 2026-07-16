import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './auth/AuthContext';
import { LoginForm } from './components/LoginForm';
import { AdminView, Layout } from './components/Layout';
import { Customers } from './pages/Customers';
import { Coupons } from './pages/Coupons';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';

function ActivePage({ view }: { view: AdminView }) {
  if (view === 'products') return <Products />;
  if (view === 'orders') return <Orders />;
  if (view === 'customers') return <Customers />;
  if (view === 'reviews') return <Reviews />;
  if (view === 'coupons') return <Coupons />;
  if (view === 'settings') return <Settings />;
  return <Dashboard />;
}

export default function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-right" />
      {user ? (
        <Layout activeView={activeView} onViewChange={setActiveView}>
          <ActivePage view={activeView} />
        </Layout>
      ) : (
        <LoginForm />
      )}
    </>
  );
}
