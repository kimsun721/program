import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NoteRow } from "./NoteRow";

export const dynamic = "force-dynamic";

export default async function MyNotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/my/notes");

  const notes = await prisma.studyNote.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      lecture: {
        select: {
          id: true,
          title: true,
          section: {
            select: { course: { select: { id: true, title: true } } },
          },
        },
      },
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">학습 노트</h1>
        <Link href="/my" className="text-sm text-blue-600 hover:underline">
          ← 내 강의로
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        강의 차시 페이지에서 노트를 작성할 수 있습니다. 여기서는 작성한 노트를
        관리하세요.
      </p>

      <div className="mt-4 space-y-2">
        {notes.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-6 text-center text-sm text-slate-500">
            작성한 노트가 없습니다.
          </p>
        )}
        {notes.map((n) => (
          <NoteRow
            key={n.id}
            note={{
              id: n.id,
              content: n.content,
              timestampSec: n.timestampSec,
              updatedAt: n.updatedAt,
              courseTitle: n.lecture.section.course.title,
              lectureTitle: n.lecture.title,
            }}
          />
        ))}
      </div>
    </div>
  );
}
