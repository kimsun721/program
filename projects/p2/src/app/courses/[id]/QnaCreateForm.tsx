"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createQuestion } from "@/actions/qna";

type Props = {
  courseId: string;
  lectures?: { id: string; title: string }[];
};

export function QnaCreateForm({ courseId, lectures = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        + 질문 작성
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const res = await createQuestion(courseId, fd);
          if ("error" in res && res.error) setError(res.error);
          else {
            setSuccess(res.success ?? "등록됨");
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="rounded-md border bg-slate-50 p-3"
    >
      <div className="grid grid-cols-1 gap-2">
        <input
          name="title"
          placeholder="제목"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <select
          name="lectureId"
          defaultValue=""
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="">(차시 선택 - 선택사항)</option>
          {lectures.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        <textarea
          name="content"
          rows={4}
          placeholder="내용"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-emerald-700">{success}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          등록
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border px-3 py-1.5 text-xs"
        >
          취소
        </button>
      </div>
    </form>
  );
}
