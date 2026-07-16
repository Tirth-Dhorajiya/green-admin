import { useEffect, useState } from 'react';
import { Boxes, DollarSign, ShoppingBag, Users } from 'lucide-react';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { Stats } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get(endpoints.admin.stats).then((res) => setStats(res.data.stats));
  }, []);

  const cards = [
    { label: 'Revenue', value: stats ? `Rs. ${stats.totalRevenue.toFixed(2)}` : '-', icon: DollarSign },
    { label: 'Orders', value: stats?.totalOrders ?? '-', icon: ShoppingBag },
    { label: 'Products', value: stats?.totalProducts ?? '-', icon: Boxes },
    { label: 'Customers', value: stats?.totalUsers ?? '-', icon: Users },
  ];

  return (
    <section className="grid four">
      {cards.map(({ label, value, icon: Icon }) => (
        <article className="stat-card" key={label}>
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
          <Icon size={26} />
        </article>
      ))}
    </section>
  );
}
