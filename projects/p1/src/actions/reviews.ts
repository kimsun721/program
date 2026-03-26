"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10, "리뷰는 10자 이상 작성해주세요").max(1000),
});

export async function getReviews(courseId: string) {
  return prisma.review.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview(courseId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const raw = {
    rating: parseInt(formData.get("rating") as string),
    content: formData.get("content") as string,
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    return { error: "수강 중인 강의에만 리뷰를 작성할 수 있습니다" };
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  if (existing) {
    return { error: "이미 리뷰를 작성하셨습니다" };
  }

  await prisma.review.create({
    data: {
      userId: session.user.id,
      courseId,
      rating: parsed.data.rating,
      content: parsed.data.content,
    },
  });

  // Update course avg rating
  await updateCourseRating(courseId);

  revalidatePath(`/courses/${courseId}`);
  return { success: "리뷰가 작성되었습니다" };
}

export async function updateReview(reviewId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const raw = {
    rating: parseInt(formData.get("rating") as string),
    content: formData.get("content") as string,
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) {
    return { error: "리뷰를 수정할 권한이 없습니다" };
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: parsed.data.rating,
      content: parsed.data.content,
    },
  });

  await updateCourseRating(review.courseId);

  revalidatePath(`/courses/${review.courseId}`);
  return { success: "리뷰가 수정되었습니다" };
}

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) {
    return { error: "리뷰를 삭제할 권한이 없습니다" };
  }

  await prisma.review.delete({ where: { id: reviewId } });
  await updateCourseRating(review.courseId);

  revalidatePath(`/courses/${review.courseId}`);
  return { success: "리뷰가 삭제되었습니다" };
}

async function updateCourseRating(courseId: string) {
  const result = await prisma.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: {
      avgRating: result._avg.rating ?? 0,
      reviewCount: result._count.id,
    },
  });
}
