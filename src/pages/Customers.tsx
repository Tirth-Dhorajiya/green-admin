import { useEffect, useState } from 'react';
import api from '../api/client';
import { inputClass, PageSizeSelect, Pagination, panelClass, selectClass, SortDirection, SortHeader, tableClass, TableToolbar, tdClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { User } from '../types';

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
        <select className={selectClass} value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}>
          <option value="all">All roles</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <PageSizeSelect value={limit} onChange={(value) => { setLimit(value); setPage(1); }} />
      </TableToolbar>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Name" active={sortKey === 'name'} direction={sortDirection} onSort={() => updateSort('name')} />
              <SortHeader label="Email" active={sortKey === 'email'} direction={sortDirection} onSort={() => updateSort('email')} />
              <SortHeader label="Role" active={sortKey === 'role'} direction={sortDirection} onSort={() => updateSort('role')} />
              <SortHeader label="Joined" active={sortKey === 'joined'} direction={sortDirection} onSort={() => updateSort('joined')} />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className={tdClass}>{customer.name}</td>
                <td className={tdClass}>{customer.email}</td>
                <td className={tdClass}>{customer.role}</td>
                <td className={tdClass}>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={4} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No customers match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
