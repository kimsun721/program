"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBook } from "@/actions/vocab";

export function CreateBookForm({
  courseOptions,
}: {
  courseOptions: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await createBook(fd);
          if ("error" in res && res.error) setError(res.error);
          else if ("bookId" in res && res.bookId) {
            router.push(`/my/vocab/${res.bookId}`);
          } else {
            router.refresh();
          }
        });
      }}
      className="rounded-md border bg-slate-50 p-3"
    >
      <div className="flex flex-wrap gap-2">
        <input
          name="title"
          placeholder="단어장 제목"
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          required
        />
        <select
          name="courseId"
          defaultValue=""
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="">강의 연결 안 함</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          만들기
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
