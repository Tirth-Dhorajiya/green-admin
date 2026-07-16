import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { BrandedSelect, inputClass, Pagination, panelClass, SortDirection, SortHeader, tableClass, TableSkeletonRows, TableToolbar, tdClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Review } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

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
  const [loading, setLoading] = useState(true);
  const [reviewToHide, setReviewToHide] = useState<Review | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortKey, sortDirection, query, statusFilter, ratingFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const updateReviewStatus = async (id: string, status: Review['status']) => {
    await api.put(endpoints.admin.reviewStatus(id), { status });
    toast.success('Review updated');
    loadReviews();
  };

  const requestReviewStatus = (review: Review, status: Review['status']) => {
    if (status === 'hidden' && review.status !== 'hidden') {
      setReviewToHide(review);
      return;
    }
    updateReviewStatus(review.id, status);
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
        <BrandedSelect
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'visible', label: 'Visible' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
        <BrandedSelect
          value={ratingFilter}
          onChange={(value) => { setRatingFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All ratings' },
            ...[5, 4, 3, 2, 1].map((rating) => ({ value: String(rating), label: `${rating} stars` })),
          ]}
        />
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
            {loading ? (
              <TableSkeletonRows rows={limit} columns={5} />
            ) : reviews.map((review) => (
              <tr key={review.id}>
                <td className={tdClass}>{review.product_name}</td>
                <td className={tdClass}>
                  <strong>{review.user_name}</strong>
                  <span className="mt-1 block text-xs text-stone-500">{review.user_email}</span>
                </td>
                <td className={tdClass}>{review.rating}/5</td>
                <td className={`${tdClass} max-w-sm whitespace-normal`}>{review.comment || '-'}</td>
                <td className={tdClass}>
                  <BrandedSelect
                    value={review.status}
                    onChange={(value) => requestReviewStatus(review, value as Review['status'])}
                    options={[
                      { value: 'visible', label: 'Visible' },
                      { value: 'hidden', label: 'Hidden' },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {!loading && !reviews.length && (
              <tr>
                <td colSpan={5} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No reviews match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} />
      <ConfirmationModal
        open={!!reviewToHide}
        onClose={() => setReviewToHide(null)}
        onConfirm={async () => {
          if (reviewToHide) await updateReviewStatus(reviewToHide.id, 'hidden');
        }}
        title="Hide review?"
        message="This review will be hidden from customers until you make it visible again."
        confirmText="Hide"
        variant="warning"
      />
    </section>
  );
}
