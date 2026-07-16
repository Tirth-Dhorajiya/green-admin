import { useEffect, useState } from 'react';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { User } from '../types';

export function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);

  useEffect(() => {
    api.get(`${endpoints.admin.customers}?limit=100`).then((res) => setCustomers(res.data.customers));
  }, []);

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.role}</td>
                <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
