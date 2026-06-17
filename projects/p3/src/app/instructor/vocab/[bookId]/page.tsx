import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  addVocabItem,
  updateVocabItem,
  deleteVocabItem,
  updateCourseVocabBook,
} from "@/actions/instructor-vocab";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Globe,
  Lock,
  BookOpen,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const book = await prisma.vocabularyBook.findUnique({ where: { id: bookId } });
  return { title: book?.title ?? "단어장 관리" };
}

export default async function InstructorVocabBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const user = await requireRole("INSTRUCTOR");

  const book = await prisma.vocabularyBook.findUnique({
    where: { id: bookId, userId: user.id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      course: { select: { id: true, title: true } },
    },
  });
  if (!book) notFound();

  async function handleAddItem(formData: FormData) {
    "use server";
    await addVocabItem(bookId, formData);
  }

  async function handleDeleteItem(formData: FormData) {
    "use server";
    const itemId = formData.get("itemId") as string;
    await deleteVocabItem(itemId);
  }

  async function handleUpdateBook(formData: FormData) {
    "use server";
    await updateCourseVocabBook(bookId, formData);
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <Link
            href="/instructor/vocab"
            className="text-gray-400 hover:text-gray-600 mt-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
              {book.isPublic ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Globe className="h-3 w-3" />공개
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" />비공개
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {book.course ? (
                <span className="text-blue-500">{book.course.title}</span>
              ) : "강의 미연결"}{" "}
              · 단어 {book.items.length}개
            </p>
          </div>
        </div>

        {/* 공개 토글 */}
        <form action={handleUpdateBook}>
          <input type="hidden" name="title" value={book.title} />
          <input
            type="hidden"
            name="isPublic"
            value={String(!book.isPublic)}
          />
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              book.isPublic
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {book.isPublic ? (
              <><Globe className="h-3.5 w-3.5" />공개 중 (비공개로 변경)</>
            ) : (
              <><Lock className="h-3.5 w-3.5" />비공개 (공개로 변경)</>
            )}
          </button>
        </form>
      </div>

      {/* 단어 추가 폼 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          단어 추가
        </h2>
        <form action={handleAddItem} className="flex gap-2 flex-wrap">
          <input
            name="term"
            type="text"
            placeholder="단어 (영어)"
            className="flex-1 min-w-32 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            required
          />
          <input
            name="meaning"
            type="text"
            placeholder="뜻 (한국어)"
            className="flex-1 min-w-32 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            required
          />
          <input
            name="example"
            type="text"
            placeholder="예문 (선택)"
            className="flex-2 min-w-40 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 whitespace-nowrap"
          >
            추가
          </button>
        </form>
      </div>

      {/* 단어 목록 */}
      {book.items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">단어가 없습니다. 위에서 단어를 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {book.items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-3 group hover:border-blue-200"
            >
              <span className="text-xs text-gray-300 font-mono mt-0.5 w-6 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900">{item.term}</span>
                  <span className="text-gray-400 text-sm">{item.meaning}</span>
                </div>
                {item.example && (
                  <p className="text-xs text-gray-400 mt-0.5 italic">
                    &ldquo;{item.example}&rdquo;
                  </p>
                )}
              </div>
              <form action={handleDeleteItem} className="flex-shrink-0">
                <input type="hidden" name="itemId" value={item.id} />
                <ConfirmSubmit
                  message={`'${item.term}' 단어를 삭제할까요?`}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </ConfirmSubmit>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
