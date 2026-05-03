"use client";

import { QnaCreateForm } from "./QnaCreateForm";

type Question = {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  user: { id: string; nickname: string };
  lecture: { id: string; title: string } | null;
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    user: { nickname: string };
  }[];
};

type Props = {
  courseId: string;
  isEnrolled: boolean;
  lectures: { id: string; title: string }[];
  questions: Question[];
};

export function CourseQnaSection({
  courseId,
  isEnrolled,
  lectures,
  questions,
}: Props) {
  return (
    <div className="space-y-4">
      {isEnrolled ? (
        <QnaCreateForm courseId={courseId} lectures={lectures} />
      ) : (
        <p className="rounded-md border bg-amber-50 p-3 text-sm text-amber-700">
          수강 중인 회원만 질문을 작성할 수 있습니다.
        </p>
      )}

      <div className="space-y-3">
        {questions.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-6 text-center text-sm text-slate-500">
            아직 질문이 없습니다. 첫 질문을 남겨보세요.
          </p>
        )}
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold">{q.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {q.user.nickname}
                  {q.lecture && ` · ${q.lecture.title}`}
                </div>
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs " +
                  (q.status === "OPEN"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700")
                }
              >
                {q.status}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {q.content}
            </p>

            {q.answers.length > 0 && (
              <div className="mt-3 space-y-2 rounded-md border bg-slate-50 p-3">
                {q.answers.map((a) => (
                  <div key={a.id}>
                    <div className="text-xs font-semibold text-slate-600">
                      {a.user.nickname} 답변
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
