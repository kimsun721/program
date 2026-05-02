import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateBookForm } from "./CreateBookForm";

export const dynamic = "force-dynamic";

export default async function VocabBooksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/my/vocab");

  const [books, enrollments] = await Promise.all([
    prisma.vocabularyBook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { course: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어장</h1>
        <Link href="/my" className="text-sm text-blue-600 hover:underline">
          ← 내 강의로
        </Link>
      </div>

      <CreateBookForm
        courseOptions={enrollments.map((e) => ({
          id: e.course.id,
          title: e.course.title,
        }))}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {books.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-6 text-center text-sm text-slate-500">
            단어장이 없습니다. 위에서 만들어보세요.
          </p>
        )}
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/my/vocab/${b.id}`}
            className="rounded-lg border bg-white p-4 hover:bg-slate-50"
          >
            <div className="text-base font-semibold">{b.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              {b.course?.title ?? "전체"} · 단어 {b._count.items}개
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
