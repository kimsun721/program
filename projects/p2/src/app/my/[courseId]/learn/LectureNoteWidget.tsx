"use client";

import { useState, useTransition } from "react";
import { createNote } from "@/actions/notes";

export function LectureNoteWidget({ lectureId }: { lectureId: string }) {
  const [content, setContent] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setMsg(null);
    setError(null);
    const fd = new FormData();
    fd.append("content", content);
    if (timestamp) fd.append("timestampSec", timestamp);
    startTransition(async () => {
      const res = await createNote(lectureId, fd);
      if ("error" in res && res.error) setError(res.error);
      else {
        setMsg(res.success ?? "저장됨");
        setContent("");
        setTimestamp("");
      }
    });
  };

  return (
    <div className="rounded-lg bg-gray-800/60 p-3 text-white">
      <div className="text-xs font-semibold text-gray-300">학습 노트</div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="이 차시의 메모를 작성하세요"
        className="mt-2 w-full rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-sm placeholder:text-gray-500"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={timestamp}
          onChange={(e) =>
            setTimestamp(e.target.value.replace(/[^0-9]/g, ""))
          }
          placeholder="영상 시각(초) - 선택"
          className="w-44 rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-xs placeholder:text-gray-500"
        />
        <button
          onClick={save}
          disabled={pending || content.trim().length === 0}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {pending ? "저장 중..." : "노트 저장"}
        </button>
        {msg && <span className="text-xs text-emerald-300">{msg}</span>}
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    </div>
  );
}
