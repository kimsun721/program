"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function ensureLectureAccess(userId: string, lectureId: string) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: true },
  });
  if (!lecture) return null;
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId: lecture.section.courseId },
    },
  });
  if (!enrollment || enrollment.status === "REFUNDED") return null;
  return lecture;
}

export async function createNote(lectureId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const lec = await ensureLectureAccess(session.user.id, lectureId);
  if (!lec) return { error: "수강 중인 강의의 차시만 노트 작성 가능합니다" };

  const content = ((formData.get("content") as string) ?? "").trim();
  const tsRaw = (formData.get("timestampSec") as string) ?? "";
  const timestampSec = tsRaw ? Math.max(0, parseInt(tsRaw, 10)) : null;

  if (content.length < 1) return { error: "내용을 입력해주세요" };

  await prisma.studyNote.create({
    data: {
      userId: session.user.id,
      lectureId,
      content,
      timestampSec: Number.isFinite(timestampSec as number)
        ? (timestampSec as number)
        : null,
    },
  });
  revalidatePath("/my/notes");
  return { success: "노트를 저장했습니다" };
}

export async function updateNote(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  const note = await prisma.studyNote.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id)
    return { error: "권한이 없습니다" };

  const content = ((formData.get("content") as string) ?? "").trim();
  if (!content) return { error: "내용을 입력해주세요" };

  await prisma.studyNote.update({ where: { id }, data: { content } });
  revalidatePath("/my/notes");
  return { success: "수정 완료" };
}

export async function deleteNote(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  const note = await prisma.studyNote.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id)
    return { error: "권한이 없습니다" };

  await prisma.studyNote.delete({ where: { id } });
  revalidatePath("/my/notes");
  return { success: "삭제 완료" };
}
