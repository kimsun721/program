"use client";

import { useState, useTransition } from "react";
import { deleteQuestion, updateQuestion } from "@/actions/qna";

type Q = {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  course: { id: string; title: string };
  lecture: { id: string; title: string } | null;
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    user: { nickname: string };
  }[];
};

export function QnaItem({ question }: { question: Q }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(question.title);
  const [content, setContent] = useState(question.content);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    startTransition(async () => {
      const res = await updateQuestion(question.id, fd);
      if ("error" in res && res.error) setError(res.error);
      else setEditing(false);
    });
  };

  const del = () => {
    if (!confirm("질문을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteQuestion(question.id);
    });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border px-2 py-1 text-base font-semibold"
            />
          ) : (
            <div className="text-base font-semibold">{question.title}</div>
          )}
          <div className="mt-1 text-xs text-slate-500">
            {question.course.title}
            {question.lecture && ` · ${question.lecture.title}`}
          </div>
        </div>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (question.status === "OPEN"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700")
          }
        >
          {question.status}
        </span>
      </div>

      <div className="mt-2">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm">{question.content}</p>
        )}
      </div>

      {question.answers.length > 0 && (
        <div className="mt-3 space-y-2 rounded-md border bg-slate-50 p-3">
          {question.answers.map((a) => (
            <div key={a.id}>
              <div className="text-xs font-semibold text-slate-600">
                {a.user.nickname} 답변
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        {editing ? (
          <>
            <button
              disabled={pending}
              onClick={save}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              저장
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setTitle(question.title);
                setContent(question.content);
              }}
              className="rounded border px-3 py-1.5 text-xs"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="rounded border px-3 py-1.5 text-xs"
            >
              수정
            </button>
            <button
              disabled={pending}
              onClick={del}
              className="rounded border px-3 py-1.5 text-xs text-red-700"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
