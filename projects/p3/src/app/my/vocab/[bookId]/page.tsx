import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VocabItems } from "./VocabItems";
import { DeleteBookButton } from "./DeleteBookButton";

export const dynamic = "force-dynamic";

export default async function VocabBookDetail({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const book = await prisma.vocabularyBook.findUnique({
    where: { id: bookId },
    include: {
      course: { select: { title: true } },
      items: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!book || book.userId !== session.user.id) notFound();

  const total = book.items.length;
  const done = book.items.filter((i) => i.learned).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/my/vocab" className="text-sm text-blue-600 hover:underline">
          ← 단어장 목록
        </Link>
        <DeleteBookButton bookId={book.id} />
      </div>

      <h1 className="text-2xl font-bold">{book.title}</h1>
      <div className="mt-1 text-sm text-slate-500">
        {book.course?.title ?? "강의 연결 안 됨"}
      </div>

      <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm">
        진행률{" "}
        <span className="font-semibold">
          {done}/{total} ({pct}%)
        </span>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-6">
        <VocabItems
          bookId={book.id}
          items={book.items.map((i) => ({
            id: i.id,
            term: i.term,
            meaning: i.meaning,
            example: i.example,
            learned: i.learned,
          }))}
        />
      </div>
    </div>
  );
}
