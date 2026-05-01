import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InstructorQnaCard } from "./InstructorQnaCard";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

export default async function InstructorQnaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "OPEN";

  const session = await auth();
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: session!.user.id },
  });
  if (!profile) return null;

  const questions = await prisma.qnaQuestion.findMany({
    where: {
      course: { instructorId: profile.id },
      ...(status === "ALL" ? {} : { status }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { nickname: true } },
      course: { select: { title: true } },
      lecture: { select: { title: true } },
      answers: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { nickname: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">강의 Q&amp;A</h1>
      <p className="mt-1 text-sm text-slate-600">
        본인 강의에 달린 질문에 답변합니다.
      </p>

      <div className="mt-4 flex gap-2 text-sm">
        {["OPEN", "ANSWERED", "ALL"].map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={
              "rounded-md border px-3 py-1.5 " +
              (status === s ? "bg-slate-900 text-white" : "bg-white")
            }
          >
            {s}
          </a>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {questions.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
            해당 상태의 질문이 없습니다.
          </p>
        )}
        {questions.map((q) => (
          <InstructorQnaCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
