"use client";

import Link from "next/link";
import { CheckCircle, PlayCircle, Circle } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LectureNavigationProps {
  courseId: string;
  lecture: {
    id: string;
    title: string;
    duration: number;
    isFreePreview: boolean;
  };
  isCurrent: boolean;
  isCompleted: boolean;
}

export default function LectureNavigation({
  courseId,
  lecture,
  isCurrent,
  isCompleted,
}: LectureNavigationProps) {
  return (
    <Link
      href={`/my/${courseId}/learn?lectureId=${lecture.id}`}
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors",
        isCurrent && "bg-blue-900/40 border-l-2 border-l-blue-500"
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {isCompleted ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : isCurrent ? (
          <PlayCircle className="h-4 w-4 text-blue-400" />
        ) : (
          <Circle className="h-4 w-4 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm line-clamp-2",
            isCurrent ? "text-white font-medium" : "text-gray-300"
          )}
        >
          {lecture.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatDuration(lecture.duration)}
        </p>
      </div>
    </Link>
  );
}
