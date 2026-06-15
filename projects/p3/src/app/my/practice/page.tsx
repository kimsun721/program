import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getMyPracticeStats } from "@/actions/practice";
import Link from "next/link";
import {
  Zap,
  BookOpen,
  Mic,
  Trophy,
  TrendingUp,
  Clock,
  Globe,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "학습 연습" };

export default async function PracticePage() {
  const user = await requireUser();

  // 내 단어장 + 수강 중인 강의의 공개 단어장
  const enrolledCourseIds = await prisma.enrollment
    .findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { courseId: true },
    })
    .then((rows) => rows.map((r) => r.courseId));

  const [myBooks, courseBooks, stats] = await Promise.all([
    prisma.vocabularyBook.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { items: true } },
        items: {
          where: { nextReviewAt: { lte: new Date() } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    enrolledCourseIds.length > 0
      ? prisma.vocabularyBook.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            isPublic: true,
            NOT: { userId: user.id }, // 내 것 제외
          },
          include: {
            _count: { select: { items: true } },
            items: {
              where: { nextReviewAt: { lte: new Date() } },
              select: { id: true },
            },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    getMyPracticeStats(),
  ]);

  const totalDue =
    myBooks.reduce((s, b) => s + b.items.length, 0) +
    courseBooks.reduce((s, b) => s + b.items.length, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">학습 연습</h1>
        </div>
        <p className="text-gray-500 text-sm">
          플래시카드, 퀴즈, 스피킹으로 실력을 키워보세요
        </p>
      </div>

      {/* 오늘 복습 알림 */}
      {totalDue > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-5 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                📅 오늘 복습할 단어
              </p>
              <p className="text-3xl font-bold mt-1">{totalDue}개</p>
              <p className="text-purple-100 text-sm mt-1">
                지금 시작하면 더 잘 기억돼요!
              </p>
            </div>
            <div className="text-6xl opacity-20">🧠</div>
          </div>
        </div>
      )}

      {/* 연습 모드 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <div className="p-2 bg-blue-100 rounded-xl w-fit mb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">플래시카드</h3>
          <p className="text-sm text-gray-500 mb-3">
            SM-2 간격 반복으로 효율적으로 암기
          </p>
          <div className="text-xs text-blue-600 font-medium">
            {stats.byMode["FLASHCARD"]?.sessions ?? 0}번 연습
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5">
          <div className="p-2 bg-green-100 rounded-xl w-fit mb-3">
            <Trophy className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">객관식 퀴즈</h3>
          <p className="text-sm text-gray-500 mb-3">4지선다로 실력 테스트</p>
          <div className="text-xs text-green-600 font-medium">
            {stats.byMode["QUIZ"]
              ? `정답률 ${Math.round(
                  (stats.byMode["QUIZ"].correct / stats.byMode["QUIZ"].total) *
                    100
                )}%`
              : "아직 기록 없음"}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-5">
          <div className="p-2 bg-orange-100 rounded-xl w-fit mb-3">
            <Mic className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">스피킹 연습</h3>
          <p className="text-sm text-gray-500 mb-3">음성인식으로 발음 확인</p>
          <Link
            href="/my/practice/speaking"
            className="text-xs text-orange-600 font-medium hover:underline"
          >
            바로 시작 →
          </Link>
        </div>
      </div>

      {/* 내 단어장 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">내 단어장</h2>
          <Link href="/my/vocab" className="text-sm text-blue-600 hover:underline">
            전체 보기
          </Link>
        </div>
        {myBooks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">단어장이 없습니다.</p>
            <Link
              href="/my/vocab"
              className="text-blue-600 text-sm mt-2 inline-block hover:underline"
            >
              단어장 만들기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myBooks.map((book) => (
              <VocabBookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>

      {/* 강의 제공 단어장 */}
      {courseBooks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">강사 제공 단어장</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courseBooks.map((book) => (
              <VocabBookCard
                key={book.id}
                book={book}
                courseTitle={book.course?.title}
              />
            ))}
          </div>
        </div>
      )}

      {/* 최근 학습 기록 */}
      {stats.recent.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            최근 학습 기록
          </h2>
          <div className="space-y-2">
            {stats.recent.slice(0, 5).map((r) => {
              const accuracy =
                r.totalItems > 0
                  ? Math.round((r.correctItems / r.totalItems) * 100)
                  : 0;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3"
                >
                  <span className="text-2xl">
                    {r.mode === "FLASHCARD"
                      ? "📇"
                      : r.mode === "QUIZ"
                      ? "🎯"
                      : "🎤"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {r.mode === "FLASHCARD"
                        ? "플래시카드"
                        : r.mode === "QUIZ"
                        ? "퀴즈"
                        : "스피킹"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.totalItems}개 · 정답 {r.correctItems}개 ·{" "}
                      {r.durationSec}초
                    </p>
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      accuracy >= 80
                        ? "text-green-600"
                        : accuracy >= 60
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {accuracy}%
                  </div>
                  <Clock className="h-3.5 w-3.5 text-gray-300" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function VocabBookCard({
  book,
  courseTitle,
}: {
  book: {
    id: string;
    title: string;
    _count: { items: number };
    items: { id: string }[];
  };
  courseTitle?: string;
}) {
  const dueCount = book.items.length;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{book.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {courseTitle && (
              <span className="text-blue-500 mr-1">[{courseTitle}]</span>
            )}
            총 {book._count.items}개
            {dueCount > 0 && (
              <span className="ml-1 text-purple-600 font-medium">
                · 복습 {dueCount}개 대기
              </span>
            )}
          </p>
        </div>
        {dueCount > 0 && (
          <span className="h-5 w-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {dueCount > 9 ? "9+" : dueCount}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Link
          href={`/my/practice/vocab/${book.id}?mode=flashcard`}
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          플래시카드
        </Link>
        <Link
          href={`/my/practice/vocab/${book.id}?mode=quiz`}
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          퀴즈
        </Link>
        {dueCount > 0 && (
          <Link
            href={`/my/practice/vocab/${book.id}?mode=review`}
            className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            오늘 복습
          </Link>
        )}
      </div>
    </div>
  );
}
