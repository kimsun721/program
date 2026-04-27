"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enroll } from "@/actions/enrollments";
import { PlayCircle } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  isLoggedIn: boolean;
}

export default function EnrollButton({ courseId, isLoggedIn }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await enroll(courseId);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/my/${courseId}/learn`);
    }

    setLoading(false);
  };

  return (
    <div>
      <Button
        className="w-full mb-3"
        size="lg"
        onClick={handleEnroll}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            처리 중...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            {isLoggedIn ? "수강 신청하기" : "로그인하고 수강하기"}
          </span>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center mt-2">{error}</p>
      )}
    </div>
  );
}
