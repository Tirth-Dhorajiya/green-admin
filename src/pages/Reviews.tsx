import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { BrandedSelect, inputClass, Pagination, panelClass, SortDirection, SortHeader, tableClass, TableSkeletonRows, TableToolbar, tdClass } from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Review } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

type ReviewImage = NonNullable<Review['images']>[number];

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
  const [imageToDelete, setImageToDelete] = useState<{ review: Review; image: ReviewImage } | null>(null);

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

  const updateImageStatus = async (reviewId: string, image: ReviewImage) => {
    try {
      const status = image.status === 'visible' ? 'hidden' : 'visible';
      await api.put(endpoints.admin.reviewImageStatus(reviewId, image.id), { status });
      toast.success(status === 'visible' ? 'Review photo is visible' : 'Review photo hidden');
      await loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update review photo');
    }
  };

  const deleteImage = async (reviewId: string, imageId: string) => {
    try {
      await api.delete(endpoints.admin.reviewImage(reviewId, imageId));
      toast.success('Review photo permanently removed');
      await loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to remove review photo');
      throw error;
    }
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
              <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-stone-500">Photos</th>
              <SortHeader label="Status" active={sortKey === 'status'} direction={sortDirection} onSort={() => updateSort('status')} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={limit} columns={6} />
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
                  {review.images?.length ? (
                    <div className="flex min-w-52 flex-wrap gap-2">
                      {review.images.map((image, index) => (
                        <div key={image.id} className={`rounded-lg border p-1.5 ${image.status === 'hidden' ? 'border-amber-300 bg-amber-50 opacity-70' : 'border-stone-200 bg-white'}`}>
                          <a href={image.url} target="_blank" rel="noreferrer" className="block" title={`Open photo ${index + 1}`}>
                            <img src={image.url} alt={`Review photo ${index + 1}`} className="h-14 w-14 rounded-md object-cover" />
                          </a>
                          <div className="mt-1 flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateImageStatus(review.id, image)}
                              className="cursor-pointer rounded-md p-1.5 text-stone-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                              title={image.status === 'visible' ? 'Hide photo' : 'Show photo'}
                              aria-label={image.status === 'visible' ? `Hide photo ${index + 1}` : `Show photo ${index + 1}`}
                            >
                              {image.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageToDelete({ review, image })}
                              className="cursor-pointer rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
                              title="Permanently remove photo"
                              aria-label={`Permanently remove photo ${index + 1}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-stone-400">—</span>}
                </td>
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
                <td colSpan={6} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No reviews match the current filters.</td>
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
      <ConfirmationModal
        open={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={async () => {
          if (imageToDelete) await deleteImage(imageToDelete.review.id, imageToDelete.image.id);
        }}
        title="Delete review photo?"
        message="This permanently removes the photo from Cloudinary and the review. This action cannot be undone."
        confirmText="Delete photo"
        variant="danger"
      />
    </section>
  );
}
