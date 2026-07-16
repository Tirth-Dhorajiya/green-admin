import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Leaf } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@greenstore.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#064e3b_0%,#fbfaf8_100%)] p-6">
      <form className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-stone-900/10 bg-stone-50/85 p-10 shadow-2xl shadow-emerald-950/15 backdrop-blur-xl" onSubmit={handleSubmit}>
        <div className="absolute -right-5 -top-5 -z-10 h-32 w-32 rounded-full bg-emerald-500/35 blur-3xl" />
        <div className="absolute -bottom-5 -left-5 -z-10 h-32 w-32 rounded-full bg-emerald-950/35 blur-3xl" />

        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
            <Leaf size={16} />
            <span>Green Admin</span>
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-stone-900">Welcome Back.</h1>
          <p className="m-0 text-sm leading-6 text-stone-500">Manage inventory, orders, reviews, and featured products.</p>
        </div>

        <div className="mb-7 grid gap-5">
          <div className="grid gap-2">
            <label className="ml-1 text-xs font-extrabold uppercase tracking-widest text-stone-500" htmlFor="email">Email Address</label>
            <input
              className="w-full rounded-lg border border-stone-900/10 bg-white/80 px-4 py-3.5 text-sm font-medium text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="admin@greenstore.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="ml-1 text-xs font-extrabold uppercase tracking-widest text-stone-500" htmlFor="password">Password</label>
            <input
              className="w-full rounded-lg border border-stone-900/10 bg-white/80 px-4 py-3.5 text-sm font-medium text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button className="flex w-full items-center justify-center rounded-lg bg-emerald-600 p-4 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-emerald-600/30 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
          {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
