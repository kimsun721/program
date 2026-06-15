"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { issueCertificate } from "@/actions/certificate";

export function IssueButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await issueCertificate(courseId);
      if ("error" in res && res.error) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
    >
      {pending ? "발급 중..." : "수료증 발급"}
    </button>
  );
}
