"use client";

import { useState, useTransition } from "react";
import { deleteNote, updateNote } from "@/actions/notes";

type Note = {
  id: string;
  content: string;
  timestampSec: number | null;
  updatedAt: Date;
  courseTitle: string;
  lectureTitle: string;
};

function formatTs(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function NoteRow({ note }: { note: Note }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  const save = () => {
    const fd = new FormData();
    fd.append("content", content);
    startTransition(async () => {
      const res = await updateNote(note.id, fd);
      if ("error" in res && res.error) alert(res.error);
      else setEditing(false);
    });
  };

  const del = () => {
    if (!confirm("노트를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteNote(note.id);
    });
  };

  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-slate-500">
        {note.courseTitle} · {note.lectureTitle}
        {note.timestampSec != null && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono">
            {formatTs(note.timestampSec)}
          </span>
        )}
      </div>
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
        />
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm">{note.content}</p>
      )}

      <div className="mt-2 flex gap-2">
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
                setContent(note.content);
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
