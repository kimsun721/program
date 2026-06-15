"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { initiatePayment } from "@/actions/payments";
import { PlayCircle, ShoppingCart, Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  price: number;
  isLoggedIn: boolean;
}

export default function EnrollButton({
  courseId,
  price,
  isLoggedIn,
}: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }

    startTransition(async () => {
      setError(null);

      if (price === 0) {
        // 무료 강의: 바로 수강 신청
        const result = await initiatePayment(courseId);
        if ("error" in result) {
          setError(result.error ?? "오류가 발생했습니다.");
          return;
        }
        router.push(`/my/${courseId}/learn`);
        router.refresh();
        return;
      }

      // 유료 강의: Toss 결제 페이지로 이동
      router.push(`/payment?courseId=${courseId}`);
    });
  };

  return (
    <div>
      <Button
        className="w-full mb-3"
        size="lg"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : price === 0 ? (
          <span className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            {isLoggedIn ? "무료 수강 신청" : "로그인하고 수강하기"}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {isLoggedIn ? "결제하고 수강하기" : "로그인하고 수강하기"}
          </span>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center mt-1">{error}</p>
      )}
    </div>
  );
}
