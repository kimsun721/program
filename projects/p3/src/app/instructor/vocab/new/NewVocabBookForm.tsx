"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCourseVocabBook } from "@/actions/instructor-vocab";
import { Globe, Lock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
}

export default function NewVocabBookForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("isPublic", String(isPublic));

    startTransition(async () => {
      setError(null);
      const result = await createCourseVocabBook(formData);
      if ("error" in result) {
        setError(result.error ?? "오류가 발생했습니다.");
        return;
      }
      router.push(`/instructor/vocab/${result.bookId}`);
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/vocab" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">새 단어장 만들기</h1>
          <p className="text-sm text-gray-500">강의에 연결된 단어장을 만들어 학생들과 공유하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            단어장 제목 <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder="예: Unit 1 핵심 단어"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            연결 강의 <span className="text-gray-400">(선택)</span>
          </label>
          <select
            name="courseId"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">강의 미연결</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {courses.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              공개된 강의가 없습니다. 강의 승인 후 연결할 수 있습니다.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">공개 설정</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
                isPublic
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Globe className="h-4 w-4" />
              <div className="text-left">
                <div className="font-semibold">공개</div>
                <div className="text-xs opacity-70">수강생이 연습 가능</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
                !isPublic
                  ? "border-gray-500 bg-gray-50 text-gray-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Lock className="h-4 w-4" />
              <div className="text-left">
                <div className="font-semibold">비공개</div>
                <div className="text-xs opacity-70">나만 볼 수 있음</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "만드는 중..." : "단어장 만들기"}
          </Button>
          <Link
            href="/instructor/vocab"
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
