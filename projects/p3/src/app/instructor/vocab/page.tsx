import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteCourseVocabBook } from "@/actions/instructor-vocab";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { BookOpen, Plus, Globe, Lock, Trash2, Eye } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "단어장 관리" };
export const dynamic = "force-dynamic";

export default async function InstructorVocabPage() {
  const user = await requireRole("INSTRUCTOR");

  const [books, courses] = await Promise.all([
    prisma.vocabularyBook.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { items: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { instructor: { userId: user.id }, status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  async function deleteBook(formData: FormData) {
    "use server";
    const id = formData.get("bookId") as string;
    await deleteCourseVocabBook(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">단어장 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            강의별 단어장을 만들고 학생들과 공유하세요
          </p>
        </div>
        <Link
          href="/instructor/vocab/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          새 단어장
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">단어장이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            강의 단어장을 만들어 학생들의 학습을 도와주세요
          </p>
          <Link
            href="/instructor/vocab/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            첫 단어장 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {book.title}
                  </h3>
                  {book.isPublic ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Globe className="h-3 w-3" />
                      공개
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" />
                      비공개
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {book.course ? (
                    <span className="text-blue-500">{book.course.title}</span>
                  ) : (
                    "강의 미연결"
                  )}{" "}
                  · 단어 {book._count.items}개
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/instructor/vocab/${book.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  관리
                </Link>
                <form action={deleteBook}>
                  <input type="hidden" name="bookId" value={book.id} />
                  <ConfirmSubmit
                    message={`'${book.title}' 단어장을 삭제할까요?\n포함된 단어가 모두 삭제되며 되돌릴 수 없습니다.`}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 강의 목록 없을 때 안내 */}
      {courses.length === 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          📚 공개된 강의가 없습니다. 단어장을 강의에 연결하려면 먼저 강의를 개설하고 승인을 받으세요.
        </div>
      )}
    </div>
  );
}
