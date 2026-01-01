import { useEffect, useState } from 'react';
import { deleteReview, getReviews, submitReview } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Button } from './ui/button.tsx';
import { Loader2, Star, Trash2 } from 'lucide-react';

interface ReviewSectionProps {
  targetType: 'route' | 'stop';
  targetId: string;
  title?: string;
}

export default function ReviewSection({ targetType, targetId, title }: ReviewSectionProps) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const data = await getReviews(targetType, targetId) as any;
      setReviews(data.reviews || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để gửi đánh giá.');
      return;
    }

    try {
      setSubmitting(true);
      await submitReview({
        targetType,
        targetId,
        rating: form.rating,
        comment: form.comment,
      });
      setForm({ rating: 5, comment: '' });
      loadReviews();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xoá đánh giá.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-orange uppercase tracking-wider mb-1">
            Đánh giá
          </p>
          <h3 className="text-lg font-bold text-navy">{title || 'Đánh giá & phản hồi'}</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Star className="h-4 w-4 fill-orange text-orange" />
          <span>{reviews.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải đánh giá...
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {reviews.length === 0 && (
            <p className="text-sm text-gray-500">Chưa có đánh giá nào.</p>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy">{review.user?.name || 'Người dùng'}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating || 0 }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 text-orange fill-orange" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{review.user?.email}</p>
                </div>
                {isAuthenticated && (user?.id === review.user?.id || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {review.comment && <p className="text-sm text-gray-700 mt-2">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
              className={`p-2 rounded ${form.rating >= star ? 'text-orange' : 'text-gray-300'}`}
            >
              <Star className={`h-5 w-5 ${form.rating >= star ? 'fill-orange' : ''}`} />
            </button>
          ))}
        </div>

        <textarea
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:border-orange transition-all"
          rows={3}
          placeholder="Chia sẻ cảm nhận của bạn..."
          value={form.comment}
          onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="bg-navy hover:bg-navy/90" disabled={submitting}>
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </form>
    </section>
  );
}
