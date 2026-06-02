import StarRating from "./StarRating";
import type { Review } from "@/lib/types";

interface ReviewListProps {
  reviews: Review[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        Sé el primero en dejar una opinión
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-800 text-sm">{review.author_name}</span>
            <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
          </div>
          <StarRating value={review.rating} size="sm" readonly />
          {review.comment && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
