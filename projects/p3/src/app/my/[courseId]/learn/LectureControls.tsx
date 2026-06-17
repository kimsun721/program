"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markLectureComplete } from "@/actions/enrollments";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

export default function LectureControls({
  courseId,
  enrollmentId,
  lectureId,
  isCompleted,
  prevLectureId,
  nextLectureId,
}: {
  courseId: string;
  enrollmentId: string;
  lectureId: string;
  isCompleted: boolean;
  prevLectureId: string | null;
  nextLectureId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = (id: string) => router.push(`/my/${courseId}/learn?lectureId=${id}`);

  const handleComplete = () => {
    startTransition(async () => {
      await markLectureComplete(enrollmentId, lectureId);
      router.refresh();
      // 완료 후 다음 강의가 있으면 자동 이동
      if (nextLectureId) go(nextLectureId);
    });
  };

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        onClick={() => prevLectureId && go(prevLectureId)}
        disabled={!prevLectureId}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </button>

      {!isCompleted && (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {isPending ? "처리 중..." : "완료로 표시"}
        </button>
      )}

      <button
        onClick={() => nextLectureId && go(nextLectureId)}
        disabled={!nextLectureId}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
