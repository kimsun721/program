"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

async function getInstructorProfile() {
  const user = await requireRole("INSTRUCTOR");
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: user.id, status: "APPROVED" },
  });
  if (!profile) throw new Error("승인된 강사 프로필이 없습니다.");
  return { user, profile };
}

export async function createSpeakingPrompt(formData: FormData) {
  const { user } = await getInstructorProfile();

  const text = ((formData.get("text") as string) ?? "").trim();
  const hint = ((formData.get("hint") as string) ?? "").trim();
  const courseId = (formData.get("courseId") as string) || null;

  if (!text) return { error: "문장을 입력해주세요." };
  if (!hint) return { error: "힌트를 입력해주세요." };
  if (text.length > 500) return { error: "문장은 500자 이내로 입력해주세요." };

  if (courseId) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructor: { userId: user.id } },
    });
    if (!course) return { error: "해당 강의에 대한 권한이 없습니다." };
  }

  await prisma.speakingPrompt.create({
    data: {
      text,
      hint,
      courseId,
      createdBy: user.id,
    },
  });

  revalidatePath("/instructor/prompts");
  return { success: true };
}

export async function toggleSpeakingPrompt(promptId: string) {
  const { user } = await getInstructorProfile();

  const prompt = await prisma.speakingPrompt.findUnique({
    where: { id: promptId, createdBy: user.id },
  });
  if (!prompt) return { error: "권한이 없습니다." };

  await prisma.speakingPrompt.update({
    where: { id: promptId },
    data: { isActive: !prompt.isActive },
  });

  revalidatePath("/instructor/prompts");
  return { success: true };
}

export async function deleteSpeakingPrompt(promptId: string) {
  const { user } = await getInstructorProfile();

  const prompt = await prisma.speakingPrompt.findUnique({
    where: { id: promptId, createdBy: user.id },
  });
  if (!prompt) return { error: "권한이 없습니다." };

  await prisma.speakingPrompt.delete({ where: { id: promptId } });
  revalidatePath("/instructor/prompts");
  return { success: true };
}

/** 학생 실습용 — 활성 프롬프트 조회 */
export async function getActivePrompts(courseId?: string) {
  return prisma.speakingPrompt.findMany({
    where: {
      isActive: true,
      ...(courseId ? { OR: [{ courseId }, { courseId: null }] } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, hint: true },
    take: 50,
  });
}
