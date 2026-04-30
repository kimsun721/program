"use client";

import { useState, useTransition } from "react";
import { adminApproveCourse, adminRejectCourse } from "@/actions/admin";

type Course = {
  id: string;
  title: string;
  slug: string;
  status: string;
  level: string;
  price: number;
  languageName: string;
  categoryName: string;
  sectionsCount: number;
  instructorName: string;
  instructorEmail: string;
  rejectionReason: string | null;
};

export function CourseApprovalRow({ course }: { course: Course }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const res = await adminApproveCourse(course.id);
      if ("error" in res && res.error) setError(res.error);
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const res = await adminRejectCourse(course.id, reason);
      if ("error" in res && res.error) setError(res.error);
      else setShowReject(false);
    });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold">{course.title}</div>
          <div className="text-sm text-slate-500">
            {course.languageName} · {course.categoryName} · {course.level} ·{" "}
            ₩{course.price.toLocaleString()} · 섹션 {course.sectionsCount}개
          </div>
          <div className="mt-1 text-xs text-slate-500">
            강사: {course.instructorName} ({course.instructorEmail})
          </div>
        </div>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (course.status === "REVIEW"
              ? "bg-amber-100 text-amber-700"
              : course.status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-700"
                : course.status === "HIDDEN"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-200 text-slate-600")
          }
        >
          {course.status}
        </span>
      </div>

      {course.status === "HIDDEN" && course.rejectionReason && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          반려 사유: {course.rejectionReason}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {course.status === "REVIEW" && (
        <div className="mt-4 flex gap-2">
          <a
            href={`/courses/${course.slug}`}
            target="_blank"
            className="rounded border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            미리보기
          </a>
          <button
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            disabled={pending}
            onClick={approve}
          >
            게시 승인
          </button>
          <button
            className="rounded border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            disabled={pending}
            onClick={() => setShowReject((v) => !v)}
          >
            반려
          </button>
        </div>
      )}

      {showReject && (
        <div className="mt-3 rounded-md border bg-slate-50 p-3">
          <label className="text-xs font-semibold text-slate-600">
            반려 사유 (5자 이상)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            rows={3}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded border px-3 py-1 text-sm"
              onClick={() => setShowReject(false)}
            >
              취소
            </button>
            <button
              className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              disabled={pending || reason.trim().length < 5}
              onClick={reject}
            >
              반려 처리
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
