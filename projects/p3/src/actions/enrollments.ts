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

  await prisma.lectureProgress.upsert({
    where: {
      enrollmentId_lectureId: {
        enrollmentId,
        lectureId,
      },
    },
    update: {
      watchedSeconds,
      isCompleted,
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

export async function enroll(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
  });

  if (!course) return { error: "강의를 찾을 수 없습니다" };

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  if (existing) return { error: "이미 수강 중인 강의입니다" };

  const enrollment = await prisma.enrollment.create({
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
