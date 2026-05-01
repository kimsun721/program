"use server";

import { prisma } from "@/lib/prisma";
import { assertRoleInAction } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getMyInstructorProfile() {
  const guard = await assertRoleInAction("INSTRUCTOR");
  if (!guard.ok) return { ok: false as const, error: guard.error };
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: guard.user.id },
  });
  if (!profile || profile.status !== "APPROVED") {
    return { ok: false as const, error: "강사 권한이 없습니다" };
  }
  return { ok: true as const, profile, userId: guard.user.id };
}

async function assertOwnsCourse(courseId: string) {
  const g = await getMyInstructorProfile();
  if (!g.ok) return g;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== g.profile.id) {
    return { ok: false as const, error: "본인 강의가 아닙니다" };
  }
  return { ok: true as const, course, profile: g.profile };
}

const courseSchema = z.object({
  title: z.string().min(3, "제목은 3자 이상이어야 합니다"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "slug는 소문자/숫자/-만 사용 가능합니다"),
  description: z.string().min(20, "설명은 20자 이상이어야 합니다"),
  thumbnail: z.string().url().optional().or(z.literal("")),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  price: z.coerce.number().int().min(0),
  languageId: z.string().min(1),
  categoryId: z.string().min(1),
});

export async function instructorCreateCourse(formData: FormData) {
  const g = await getMyInstructorProfile();
  if (!g.ok) return { error: g.error };

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    thumbnail: formData.get("thumbnail") ?? "",
    level: formData.get("level"),
    price: formData.get("price"),
    languageId: formData.get("languageId"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dup = await prisma.course.findUnique({ where: { slug: parsed.data.slug } });
  if (dup) return { error: "이미 사용 중인 slug입니다" };

  const course = await prisma.course.create({
    data: {
      ...parsed.data,
      thumbnail: parsed.data.thumbnail || null,
      instructorId: g.profile.id,
      status: "DRAFT",
    },
  });

  revalidatePath("/instructor/courses");
  return { success: "강의를 생성했습니다", courseId: course.id };
}

export async function instructorUpdateCourse(id: string, formData: FormData) {
  const own = await assertOwnsCourse(id);
  if (!own.ok) return { error: own.error };

  if (own.course.status === "PUBLISHED") {
    return { error: "게시된 강의는 수정할 수 없습니다 (먼저 비공개 요청)" };
  }

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    thumbnail: formData.get("thumbnail") ?? "",
    level: formData.get("level"),
    price: formData.get("price"),
    languageId: formData.get("languageId"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.slug !== own.course.slug) {
    const dup = await prisma.course.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (dup) return { error: "이미 사용 중인 slug입니다" };
  }

  await prisma.course.update({
    where: { id },
    data: {
      ...parsed.data,
      thumbnail: parsed.data.thumbnail || null,
    },
  });

  revalidatePath(`/instructor/courses/${id}`);
  return { success: "수정 완료" };
}

export async function instructorDeleteCourse(id: string) {
  const own = await assertOwnsCourse(id);
  if (!own.ok) return { error: own.error };
  if (own.course.status !== "DRAFT") {
    return { error: "DRAFT 상태의 강의만 삭제할 수 있습니다" };
  }
  await prisma.course.delete({ where: { id } });
  revalidatePath("/instructor/courses");
  return { success: "삭제 완료" };
}

export async function instructorSubmitForReview(id: string) {
  const own = await assertOwnsCourse(id);
  if (!own.ok) return { error: own.error };
  if (own.course.status !== "DRAFT" && own.course.status !== "HIDDEN") {
    return { error: "현재 상태에서는 게시 요청을 할 수 없습니다" };
  }

  const sectionCount = await prisma.section.count({
    where: { courseId: id },
  });
  if (sectionCount === 0) {
    return { error: "최소 1개 이상의 섹션이 필요합니다" };
  }

  await prisma.course.update({
    where: { id },
    data: { status: "REVIEW", reviewedAt: null, rejectionReason: null },
  });
  revalidatePath(`/instructor/courses/${id}`);
  return { success: "게시 요청을 보냈습니다" };
}

export async function instructorAddSection(courseId: string, title: string) {
  const own = await assertOwnsCourse(courseId);
  if (!own.ok) return { error: own.error };
  if (!title || title.trim().length < 2) return { error: "제목을 입력해주세요" };

  const max = await prisma.section.aggregate({
    where: { courseId },
    _max: { sortOrder: true },
  });
  await prisma.section.create({
    data: {
      courseId,
      title: title.trim(),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  return { success: "섹션 추가 완료" };
}

export async function instructorUpdateSection(
  sectionId: string,
  title: string
) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });
  if (!section) return { error: "섹션을 찾을 수 없습니다" };

  const own = await assertOwnsCourse(section.courseId);
  if (!own.ok) return { error: own.error };

  await prisma.section.update({
    where: { id: sectionId },
    data: { title: title.trim() },
  });
  revalidatePath(`/instructor/courses/${section.courseId}`);
  return { success: "수정 완료" };
}

export async function instructorDeleteSection(sectionId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });
  if (!section) return { error: "섹션을 찾을 수 없습니다" };
  const own = await assertOwnsCourse(section.courseId);
  if (!own.ok) return { error: own.error };

  await prisma.section.delete({ where: { id: sectionId } });
  revalidatePath(`/instructor/courses/${section.courseId}`);
  return { success: "삭제 완료" };
}

const lectureSchema = z.object({
  title: z.string().min(2),
  hlsUrl: z.string().url().optional().or(z.literal("")),
  duration: z.coerce.number().int().min(0),
  isFreePreview: z.coerce.boolean().optional(),
});

export async function instructorAddLecture(
  sectionId: string,
  formData: FormData
) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });
  if (!section) return { error: "섹션을 찾을 수 없습니다" };
  const own = await assertOwnsCourse(section.courseId);
  if (!own.ok) return { error: own.error };

  const parsed = lectureSchema.safeParse({
    title: formData.get("title"),
    hlsUrl: formData.get("hlsUrl") ?? "",
    duration: formData.get("duration") ?? 0,
    isFreePreview: formData.get("isFreePreview") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const max = await prisma.lecture.aggregate({
    where: { sectionId },
    _max: { sortOrder: true },
  });
  await prisma.lecture.create({
    data: {
      sectionId,
      title: parsed.data.title,
      hlsUrl: parsed.data.hlsUrl || null,
      duration: parsed.data.duration,
      isFreePreview: !!parsed.data.isFreePreview,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath(`/instructor/courses/${section.courseId}`);
  return { success: "차시 추가 완료" };
}

export async function instructorUpdateLecture(
  lectureId: string,
  formData: FormData
) {
  const lec = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: true },
  });
  if (!lec) return { error: "차시를 찾을 수 없습니다" };
  const own = await assertOwnsCourse(lec.section.courseId);
  if (!own.ok) return { error: own.error };

  const parsed = lectureSchema.safeParse({
    title: formData.get("title"),
    hlsUrl: formData.get("hlsUrl") ?? "",
    duration: formData.get("duration") ?? 0,
    isFreePreview: formData.get("isFreePreview") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.lecture.update({
    where: { id: lectureId },
    data: {
      title: parsed.data.title,
      hlsUrl: parsed.data.hlsUrl || null,
      duration: parsed.data.duration,
      isFreePreview: !!parsed.data.isFreePreview,
    },
  });
  revalidatePath(`/instructor/courses/${lec.section.courseId}`);
  return { success: "수정 완료" };
}

export async function instructorDeleteLecture(lectureId: string) {
  const lec = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: true },
  });
  if (!lec) return { error: "차시를 찾을 수 없습니다" };
  const own = await assertOwnsCourse(lec.section.courseId);
  if (!own.ok) return { error: own.error };

  await prisma.lecture.delete({ where: { id: lectureId } });
  revalidatePath(`/instructor/courses/${lec.section.courseId}`);
  return { success: "삭제 완료" };
}

export async function instructorAnswerQna(questionId: string, content: string) {
  const guard = await assertRoleInAction("INSTRUCTOR");
  if (!guard.ok) return { error: guard.error };

  const question = await prisma.qnaQuestion.findUnique({
    where: { id: questionId },
    include: {
      course: { select: { instructor: { select: { userId: true } } } },
    },
  });
  if (!question) return { error: "질문을 찾을 수 없습니다" };
  if (question.course.instructor.userId !== guard.user.id) {
    return { error: "본인 강의의 질문이 아닙니다" };
  }
  if (!content || content.trim().length < 2) {
    return { error: "답변 내용을 입력해주세요" };
  }

  await prisma.$transaction([
    prisma.qnaAnswer.create({
      data: {
        questionId,
        userId: guard.user.id,
        content: content.trim(),
      },
    }),
    prisma.qnaQuestion.update({
      where: { id: questionId },
      data: { status: "ANSWERED" },
    }),
  ]);

  revalidatePath(`/instructor/qna`);
  return { success: "답변을 등록했습니다" };
}
