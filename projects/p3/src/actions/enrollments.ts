"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEnrollments() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.enrollment.findMany({
    where: { userId: session.user.id, status: { not: "REFUNDED" } },
    include: {
      course: {
        include: {
          language: true,
          instructor: {
            select: {
              realName: true,
            },
          },
          sections: {
            include: {
              lectures: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEnrollment(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    include: {
      lectureProgresses: true,
      course: {
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              lectures: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });
}

export async function saveProgress(
  enrollmentId: string,
  lectureId: string,
  watchedSeconds: number,
  isCompleted: boolean
) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  // Verify the enrollment belongs to the user
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          sections: {
            include: { lectures: true },
          },
        },
      },
    },
  });

  if (!enrollment || enrollment.userId !== session.user.id) {
    return { error: "수강 정보를 찾을 수 없습니다" };
  }

  // 기존 진도와 비교: 완료는 한 번 되면 유지(sticky), 시청시간은 단조 증가
  const existing = await prisma.lectureProgress.findUnique({
    where: { enrollmentId_lectureId: { enrollmentId, lectureId } },
    select: { watchedSeconds: true, isCompleted: true },
  });

  const nextWatched = Math.max(existing?.watchedSeconds ?? 0, watchedSeconds);
  const nextCompleted = (existing?.isCompleted ?? false) || isCompleted;

  await prisma.lectureProgress.upsert({
    where: {
      enrollmentId_lectureId: {
        enrollmentId,
        lectureId,
      },
    },
    update: {
      watchedSeconds: nextWatched,
      isCompleted: nextCompleted,
    },
    create: {
      enrollmentId,
      lectureId,
      watchedSeconds,
      isCompleted,
    },
  });

  // Recalculate overall progress
  const totalLectures = enrollment.course.sections.reduce(
    (acc, section) => acc + section.lectures.length,
    0
  );

  const completedLectures = await prisma.lectureProgress.count({
    where: {
      enrollmentId,
      isCompleted: true,
    },
  });

  const progressPct =
    totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100)
      : 0;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPct,
      status: progressPct === 100 ? "COMPLETED" : "ACTIVE",
    },
  });

  revalidatePath(`/my/${enrollment.courseId}/learn`);
  return { success: true, progressPct };
}

/** 수동 '완료로 표시' — 영상이 없거나 자동완료가 안 잡히는 차시 대비 */
export async function markLectureComplete(enrollmentId: string, lectureId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, courseId: true },
  });
  if (!enrollment || enrollment.userId !== session.user.id) {
    return { error: "수강 정보를 찾을 수 없습니다" };
  }

  const existing = await prisma.lectureProgress.findUnique({
    where: { enrollmentId_lectureId: { enrollmentId, lectureId } },
    select: { watchedSeconds: true },
  });

  return saveProgress(enrollmentId, lectureId, existing?.watchedSeconds ?? 0, true);
}

export async function enroll(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
  });

  if (!course) return { error: "강의를 찾을 수 없습니다" };

  // 유료 강의는 결제 플로우(initiatePayment)를 거쳐야 한다 — 무료 등록 우회 방지
  if (course.price > 0) {
    return { error: "유료 강의는 결제가 필요합니다." };
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  // 환불된 수강은 재등록 허용 (REFUNDED 외에는 차단)
  if (existing && existing.status !== "REFUNDED") {
    return { error: "이미 수강 중인 강의입니다" };
  }

  const enrollment = existing
    ? await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", progressPct: 0 },
      })
    : await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          courseId,
          status: "ACTIVE",
        },
      });

  // Increment enrollment count
  await prisma.course.update({
    where: { id: courseId },
    data: { enrollmentCount: { increment: 1 } },
  });

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/my");
  return { success: true, enrollmentId: enrollment.id };
}
