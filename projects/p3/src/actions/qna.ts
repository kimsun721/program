"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function ensureEnrolled(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return enrollment && enrollment.status !== "REFUNDED";
}

export async function createQuestion(courseId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const title = ((formData.get("title") as string) ?? "").trim();
  const content = ((formData.get("content") as string) ?? "").trim();
  const rawLecture = (formData.get("lectureId") as string) ?? "";
  const lectureId = rawLecture && rawLecture.length > 0 ? rawLecture : null;

  if (title.length < 2) return { error: "제목을 입력해주세요" };
  if (content.length < 2) return { error: "내용을 입력해주세요" };

  const ok = await ensureEnrolled(session.user.id, courseId);
  if (!ok) return { error: "수강 중인 강의에만 질문할 수 있습니다" };

  if (lectureId) {
    const lec = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { section: true },
    });
    if (!lec || lec.section.courseId !== courseId) {
      return { error: "유효하지 않은 차시입니다" };
    }
  }

  await prisma.qnaQuestion.create({
    data: {
      userId: session.user.id,
      courseId,
      lectureId,
      title,
      content,
      status: "OPEN",
    },
  });

  revalidatePath(`/my/qna`);
  revalidatePath(`/courses/${courseId}`);
  return { success: "질문을 등록했습니다" };
}

export async function updateQuestion(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const q = await prisma.qnaQuestion.findUnique({ where: { id } });
  if (!q) return { error: "질문을 찾을 수 없습니다" };
  if (q.userId !== session.user.id) return { error: "본인 질문이 아닙니다" };

  const title = ((formData.get("title") as string) ?? "").trim();
  const content = ((formData.get("content") as string) ?? "").trim();
  if (title.length < 2 || content.length < 2)
    return { error: "내용을 올바르게 입력해주세요" };

  await prisma.qnaQuestion.update({
    where: { id },
    data: { title, content },
  });
  revalidatePath(`/my/qna`);
  return { success: "수정 완료" };
}

export async function deleteQuestion(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const q = await prisma.qnaQuestion.findUnique({ where: { id } });
  if (!q) return { error: "질문을 찾을 수 없습니다" };
  if (q.userId !== session.user.id) return { error: "본인 질문이 아닙니다" };

  await prisma.qnaQuestion.delete({ where: { id } });
  revalidatePath(`/my/qna`);
  return { success: "삭제 완료" };
}
