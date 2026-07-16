import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { Review } from '../types';

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    const res = await api.get(`${endpoints.admin.reviews}?limit=100`);
    setReviews(res.data.reviews);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateReviewStatus = async (id: string, status: Review['status']) => {
    await api.put(endpoints.admin.reviewStatus(id), { status });
    toast.success('Review updated');
    loadReviews();
  };

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.product_name}</td>
                <td>
                  <strong>{review.user_name}</strong>
                  <span>{review.user_email}</span>
                </td>
                <td>{review.rating}/5</td>
                <td className="wide-cell">{review.comment || '-'}</td>
                <td>
                  <select value={review.status} onChange={(event) => updateReviewStatus(review.id, event.target.value as Review['status'])}>
                    <option value="visible">visible</option>
                    <option value="hidden">hidden</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
