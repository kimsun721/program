import { requireUser } from "@/lib/rbac";
import { getVocabBookForPractice } from "@/actions/practice";
import { FlashcardPractice } from "@/components/practice/FlashcardPractice";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "단어 연습" };

export default async function VocabPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  await requireUser();
  const { bookId } = await params;
  const { mode = "flashcard" } = await searchParams;

  const book = await getVocabBookForPractice(bookId);
  if (!book) redirect("/my/vocab");

  const items = mode === "review"
    ? book.items.filter((item) => new Date(item.nextReviewAt) <= new Date())
    : book.items;

  if (items.length === 0) {
    redirect(`/my/practice?empty=1`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <FlashcardPractice
        bookId={bookId}
        bookTitle={book.title}
        items={items.map((item) => ({
          id: item.id,
          term: item.term,
          meaning: item.meaning,
          example: item.example ?? undefined,
        }))}
        initialMode={mode === "quiz" ? "QUIZ" : "FLASHCARD"}
      />
    </div>
  );
}
