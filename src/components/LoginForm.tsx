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
    <div className="login-screen bg-premium-gradient">
      <form className="login-card glass" onSubmit={handleSubmit}>
        <div className="glow-circle glow-1" />
        <div className="glow-circle glow-2" />

        <div className="login-header">
          <div className="login-badge">
            <Leaf size={16} />
            <span>Green Admin</span>
          </div>
          <h1>Welcome Back.</h1>
          <p>Manage inventory, orders, reviews, and featured products.</p>
        </div>

        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="admin@greenstore.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button className="login-button" disabled={loading}>
          {loading ? <div className="spinner" /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
