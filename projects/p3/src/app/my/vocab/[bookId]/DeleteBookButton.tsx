"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteBook } from "@/actions/vocab";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("이 단어장과 모든 단어를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await deleteBook(bookId);
      if ("error" in res && res.error) alert(res.error);
      else router.push("/my/vocab");
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded border px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      단어장 삭제
    </button>
  );
}
