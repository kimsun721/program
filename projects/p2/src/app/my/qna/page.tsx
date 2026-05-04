import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QnaItem } from "./QnaItem";

export const dynamic = "force-dynamic";

export default async function MyQnaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my/qna");

  const questions = await prisma.qnaQuestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true } },
      lecture: { select: { id: true, title: true } },
      answers: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { nickname: true } } },
      },
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 Q&amp;A</h1>
        <Link href="/my" className="text-sm text-blue-600 hover:underline">
          ← 내 강의로
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        강의 상세 페이지에서 질문을 작성할 수 있습니다. 여기서는 작성한 질문을
        관리하세요.
      </p>

      <div className="mt-5 space-y-3">
        {questions.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-6 text-center text-sm text-slate-500">
            아직 작성한 질문이 없습니다.
          </p>
        )}
        {questions.map((q) => (
          <QnaItem key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
