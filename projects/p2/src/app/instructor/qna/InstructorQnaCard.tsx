"use client";

import { useState, useTransition } from "react";
import { instructorAnswerQna } from "@/actions/instructor";

type Question = {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  user: { nickname: string };
  course: { title: string };
  lecture: { title: string } | null;
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    user: { nickname: string };
  }[];
};

export function InstructorQnaCard({ question }: { question: Question }) {
  const [pending, startTransition] = useTransition();
  const [show, setShow] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await instructorAnswerQna(question.id, content);
      if ("error" in res && res.error) setError(res.error);
      else {
        setShow(false);
        setContent("");
      }
    });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-semibold">{question.title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {question.user.nickname} · {question.course.title}
            {question.lecture && ` · ${question.lecture.title}`}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{question.content}</p>
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

      <div className="mt-3">
        {show ? (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="답변 내용을 입력하세요"
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button
                onClick={submit}
                disabled={pending || content.trim().length < 2}
                className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              >
                등록
              </button>
              <button
                onClick={() => setShow(false)}
                className="rounded border px-3 py-1.5 text-xs"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShow(true)}
            className="rounded border px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            답변 작성
          </button>
        )}
      </div>
    </div>
  );
}
