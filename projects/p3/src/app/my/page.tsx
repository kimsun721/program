import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getEnrollments } from "@/actions/enrollments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, BookOpen } from "lucide-react";
import { getLevelLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 강의",
};

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my");
  }

  const enrollments = await getEnrollments();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">내 강의</h1>
        <p className="text-gray-500">수강 중인 강의를 확인하세요.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/my" className="rounded-md bg-slate-900 px-3 py-1.5 text-white">내 강의</Link>
          <Link href="/my/practice" className="rounded-md border border-purple-200 bg-purple-50 text-purple-700 px-3 py-1.5 hover:bg-purple-100">⚡ 학습 연습</Link>
          <Link href="/my/payments" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">💳 결제 내역</Link>
          <Link href="/my/notifications" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">🔔 알림</Link>
          <Link href="/my/qna" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">Q&amp;A</Link>
          <Link href="/my/vocab" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">단어장</Link>
          <Link href="/my/notes" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">학습 노트</Link>
          <Link href="/my/certificates" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">수료증</Link>
          <Link href="/my/account" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">계정</Link>
          {!session.user.role?.includes("INSTRUCTOR") && (
            <Link href="/become-instructor" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">강사 신청</Link>
          )}
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            수강 중인 강의가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            관심 있는 강의를 찾아 학습을 시작해보세요.
          </p>
          <Button asChild>
            <Link href="/courses">강의 둘러보기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const totalLectures = enrollment.course.sections.reduce(
              (acc, s) => acc + s.lectures.length,
              0
            );

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  {enrollment.course.thumbnail ? (
                    <Image
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
                      <BookOpen className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${enrollment.progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {getLevelLabel(enrollment.course.level)}
                    </Badge>
                    {enrollment.status === "COMPLETED" && (
                      <Badge variant="success" className="text-xs">
                        수료
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                    {enrollment.course.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-3">
                    {enrollment.course.instructor.realName} 강사
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>진도율</span>
                      <span className="font-medium text-blue-600">
                        {Math.round(enrollment.progressPct)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      총 {totalLectures}개 강의
                    </p>
                  </div>

                  <Button className="w-full" size="sm" asChild>
                    <Link href={`/my/${enrollment.course.id}/learn`}>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      {enrollment.progressPct > 0 ? "계속 수강하기" : "수강 시작하기"}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
