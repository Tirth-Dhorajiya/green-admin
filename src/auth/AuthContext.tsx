import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { User } from '../types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('green_admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(endpoints.auth.me);
        if (res.data.user.role !== 'admin') {
          throw new Error('Admin access required');
        }
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('green_admin_token');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post(endpoints.auth.login, { email, password });
    if (res.data.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    localStorage.setItem('green_admin_token', res.data.token);
    setUser(res.data.user);
    toast.success('Logged in');
  };

  const logout = () => {
    localStorage.removeItem('green_admin_token');
    setUser(null);
    toast.success('Logged out');
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This file intentionally exports the provider and hook together for the small admin app.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
