"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { PlayCircle, ShoppingCart } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  price: number;
  isLoggedIn: boolean;
}

export default function EnrollButton({ courseId, courseTitle, price, isLoggedIn }: EnrollButtonProps) {
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }
    setShowPayment(true);
  };

  return (
    <>
      <Button
        className="w-full mb-3"
        size="lg"
        onClick={handleClick}
      >
        {price === 0 ? (
          <span className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            {isLoggedIn ? "무료 수강 신청" : "로그인하고 수강하기"}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {isLoggedIn ? "수강 신청하기" : "로그인하고 수강하기"}
          </span>
        )}
      </Button>

      {showPayment && (
        <PaymentModal
          courseId={courseId}
          courseTitle={courseTitle}
          price={price}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
