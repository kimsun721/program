"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createReview, updateReview, deleteReview } from "@/actions/reviews";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    nickname: string;
    profileImage: string | null;
  };
}

interface ReviewSectionProps {
  courseId: string;
  reviews: Review[];
  avgRating: number;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${star}점`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({
  courseId,
  reviews: initialReviews,
  avgRating,
  isEnrolled,
  isLoggedIn,
  currentUserId,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  const userReview = reviews.find((r) => r.user.id === currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("rating", rating.toString());
    formData.set("content", content);

    const result = await createReview(courseId, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setContent("");
      setRating(5);
      // Refresh by reloading
      window.location.reload();
    }

    setSubmitting(false);
  };

  const handleEdit = async (reviewId: string) => {
    const formData = new FormData();
    formData.set("rating", editRating.toString());
    formData.set("content", editContent);

    const result = await updateReview(reviewId, formData);
    if (!result.error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, rating: editRating, content: editContent, updatedAt: new Date() }
            : r
        )
      );
      setEditingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;

    const result = await deleteReview(reviewId);
    if (!result.error) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">
            {avgRating.toFixed(1)}
          </div>
          <StarRating value={Math.round(avgRating)} readonly />
          <div className="text-sm text-gray-500 mt-1">{reviews.length}개 리뷰</div>
        </div>
      </div>

      {/* Write Review */}
      {isLoggedIn && isEnrolled && !userReview && (
        <div className="mb-8 p-6 border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-4">리뷰 작성</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                평점
              </label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                리뷰 내용
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="강의에 대한 솔직한 리뷰를 작성해주세요 (최소 10자)"
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={submitting || content.length < 10}>
              {submitting ? "제출 중..." : "리뷰 제출"}
            </Button>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-6">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={review.user.profileImage || undefined} />
                <AvatarFallback>
                  {review.user.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {review.user.nickname}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.user.id === currentUserId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(review.id);
                          setEditRating(review.rating);
                          setEditContent(review.content);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {editingId === review.id ? (
                  <div className="mt-2 space-y-3">
                    <StarRating value={editRating} onChange={setEditRating} />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(review.id)}
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <StarRating value={review.rating} readonly />
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {review.content}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
          </p>
        )}
      </div>
    </div>
  );
}
