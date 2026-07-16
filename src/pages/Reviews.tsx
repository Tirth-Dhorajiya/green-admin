import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { inputClass, PageSizeSelect, Pagination, panelClass, selectClass, SortDirection, SortHeader, tableClass, TableToolbar, tdClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Review } from '../types';

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'product' | 'customer' | 'rating' | 'comment' | 'status'>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadReviews = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: sortKey,
      order: sortDirection,
    });
    if (query) params.set('search', query);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (ratingFilter !== 'all') params.set('rating', ratingFilter);
    const res = await api.get(`${endpoints.admin.reviews}?${params.toString()}`);
    setReviews(res.data.reviews);
    setTotalCount(res.data.totalCount || 0);
    setTotalPages(res.data.totalPages || 1);
  }, [page, limit, sortKey, sortDirection, query, statusFilter, ratingFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const updateReviewStatus = async (id: string, status: Review['status']) => {
    await api.put(endpoints.admin.reviewStatus(id), { status });
    toast.success('Review updated');
    loadReviews();
  };

  const updateSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'rating' ? 'desc' : 'asc');
  };

  return (
    <section className={panelClass}>
      <TableToolbar>
        <input className={inputClass} placeholder="Search reviews" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <select className={selectClass} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <select className={selectClass} value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); setPage(1); }}>
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
        </select>
        <PageSizeSelect value={limit} onChange={(value) => { setLimit(value); setPage(1); }} />
      </TableToolbar>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Product" active={sortKey === 'product'} direction={sortDirection} onSort={() => updateSort('product')} />
              <SortHeader label="Customer" active={sortKey === 'customer'} direction={sortDirection} onSort={() => updateSort('customer')} />
              <SortHeader label="Rating" active={sortKey === 'rating'} direction={sortDirection} onSort={() => updateSort('rating')} />
              <SortHeader label="Comment" active={sortKey === 'comment'} direction={sortDirection} onSort={() => updateSort('comment')} />
              <SortHeader label="Status" active={sortKey === 'status'} direction={sortDirection} onSort={() => updateSort('status')} />
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className={tdClass}>{review.product_name}</td>
                <td className={tdClass}>
                  <strong>{review.user_name}</strong>
                  <span className="mt-1 block text-xs text-stone-500">{review.user_email}</span>
                </td>
                <td className={tdClass}>{review.rating}/5</td>
                <td className={`${tdClass} max-w-sm whitespace-normal`}>{review.comment || '-'}</td>
                <td className={tdClass}>
                  <select className={selectClass} value={review.status} onChange={(event) => updateReviewStatus(review.id, event.target.value as Review['status'])}>
                    <option value="visible">visible</option>
                    <option value="hidden">hidden</option>
                  </select>
                </td>
              </tr>
            ))}
            {!reviews.length && (
              <tr>
                <td colSpan={5} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No reviews match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
