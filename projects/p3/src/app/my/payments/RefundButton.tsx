"use client";

import { useState, useTransition } from "react";
import { requestRefund } from "@/actions/payments";

export default function RefundButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!window.confirm("정말 환불을 요청하시겠어요?\n진도가 30%를 초과하면 환불이 불가합니다.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await requestRefund(paymentId);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
      >
        {isPending ? "처리 중..." : "환불 요청"}
      </button>
      {error && <span className="text-[11px] text-red-500 max-w-[180px] text-right">{error}</span>}
    </div>
  );
}
