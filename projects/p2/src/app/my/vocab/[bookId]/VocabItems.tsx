"use client";

import { useState, useTransition } from "react";
import {
  addItem,
  deleteItem,
  toggleLearned,
  updateItem,
} from "@/actions/vocab";

type Item = {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
  learned: boolean;
};

export function VocabItems({
  bookId,
  items,
}: {
  bookId: string;
  items: Item[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onAdd = (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await addItem(bookId, fd);
      if ("error" in res && res.error) setError(res.error);
    });
  };

  return (
    <div className="space-y-3">
      <form
        action={onAdd}
        className="rounded-md border bg-slate-50 p-3"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            name="term"
            placeholder="단어"
            className="rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            name="meaning"
            placeholder="뜻"
            className="rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            name="example"
            placeholder="예문 (선택)"
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          단어 추가
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-4 text-center text-sm text-slate-500">
            단어를 추가해보세요.
          </p>
        )}
        {items.map((i) => (
          <ItemRow key={i.id} item={i} />
        ))}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    startTransition(async () => {
      await toggleLearned(item.id);
    });
  };
  const del = () => {
    if (!confirm("단어를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteItem(item.id);
    });
  };

  if (editing) {
    return (
      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await updateItem(item.id, fd);
            if ("error" in res && res.error) setError(res.error);
            else setEditing(false);
          });
        }}
        className="rounded-md border bg-white p-3"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            name="term"
            defaultValue={item.term}
            className="rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            name="meaning"
            defaultValue={item.meaning}
            className="rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            name="example"
            defaultValue={item.example ?? ""}
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded border px-3 py-1.5 text-xs"
          >
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-md border p-3 " +
        (item.learned ? "bg-emerald-50" : "bg-white")
      }
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">{item.term}</span>
          <span className="text-sm text-slate-600">— {item.meaning}</span>
        </div>
        {item.example && (
          <p className="mt-1 text-xs text-slate-500">{item.example}</p>
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={toggle}
          disabled={pending}
          className={
            "rounded border px-2 py-1 text-xs disabled:opacity-50 " +
            (item.learned ? "bg-emerald-600 text-white" : "")
          }
        >
          {item.learned ? "✓ 외움" : "외움"}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="rounded border px-2 py-1 text-xs"
        >
          수정
        </button>
        <button
          onClick={del}
          disabled={pending}
          className="rounded border px-2 py-1 text-xs text-red-700"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
