"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  instructorDeleteCourse,
  instructorSubmitForReview,
  instructorUnpublish,
} from "@/actions/instructor";

type Props = { courseId: string; status: string; canSubmit: boolean };

export function CourseStatusActions({ courseId, status, canSubmit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await instructorSubmitForReview(courseId);
      if ("error" in res && res.error) alert(res.error);
      else router.refresh();
    });
  };

  const unpublish = () => {
    if (!confirm("강의를 비공개로 전환하시겠습니까? 수강생은 더 이상 새로 신청할 수 없게 됩니다.")) return;
    startTransition(async () => {
      const res = await instructorUnpublish(courseId);
      if ("error" in res && res.error) alert(res.error);
      else router.refresh();
    });
  };

  const del = () => {
    if (!confirm("정말 삭제하시겠습니까? 작성중 상태에서만 가능합니다.")) return;
    startTransition(async () => {
      const res = await instructorDeleteCourse(courseId);
      if ("error" in res && res.error) alert(res.error);
      else router.push("/instructor/courses");
    });
  };

  return (
    <div className="flex gap-2">
      {(status === "DRAFT" || status === "HIDDEN") && (
        <button
          onClick={submit}
          disabled={pending || !canSubmit}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          title={!canSubmit ? "섹션·차시를 1개 이상 추가해주세요" : ""}
        >
          게시 요청
        </button>
      )}
      {status === "PUBLISHED" && (
        <button
          onClick={unpublish}
          disabled={pending}
          className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          비공개로 전환
        </button>
      )}
      {status === "DRAFT" && (
        <button
          onClick={del}
          disabled={pending}
          className="rounded border px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          삭제
        </button>
      )}
    </div>
  );
}
