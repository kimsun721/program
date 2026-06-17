"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

/**
 * 학생이 접근 가능한 단어장 조건:
 * - 본인이 만든 단어장, 또는
 * - 수강 중(ACTIVE)인 강의에 연결된 공개(isPublic) 단어장
 */
async function accessibleBookWhere(userId: string, bookId: string) {
  return {
    id: bookId,
    OR: [
      { userId },
      {
        isPublic: true,
        course: {
          enrollments: { some: { userId, status: "ACTIVE" } },
        },
      },
    ],
  };
}

export async function getVocabBookForPractice(bookId: string) {
  const user = await requireUser();

  const book = await prisma.vocabularyBook.findFirst({
    where: await accessibleBookWhere(user.id, bookId),
    include: {
      items: {
        orderBy: { nextReviewAt: "asc" },
      },
    },
  });

  return book;
}

export async function getDueItems(bookId: string) {
  const user = await requireUser();

  const book = await prisma.vocabularyBook.findFirst({
    where: await accessibleBookWhere(user.id, bookId),
    select: { id: true },
  });
  if (!book) return [];

  return prisma.vocabularyItem.findMany({
    where: {
      bookId,
      nextReviewAt: { lte: new Date() },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 20,
  });
}

// SM-2 spaced repetition 알고리즘
function calculateNextReview(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: number // 0-5 (0=완전실패, 5=완벽)
) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newRep: number;

  if (quality < 3) {
    newInterval = 1;
    newRep = 0;
  } else {
    newRep = repetitions + 1;
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return { easeFactor: newEF, interval: newInterval, repetitions: newRep, nextReviewAt };
}

export async function submitFlashcardResult(itemId: string, quality: number) {
  const user = await requireUser();

  // SM-2 스케줄은 단어장 row에 저장되므로 본인 소유 단어장에만 영속화한다.
  // (강사 공개 단어장은 여러 학생이 공유하므로 교차 오염을 막기 위해 영속화하지 않음)
  const item = await prisma.vocabularyItem.findFirst({
    where: {
      id: itemId,
      book: { userId: user.id },
    },
  });
  if (!item) {
    // 공유 단어장 등 본인 소유가 아니면 스케줄 갱신 없이 통과 (연습 자체는 허용)
    return { success: true, persisted: false };
  }

  const { easeFactor, interval, repetitions, nextReviewAt } = calculateNextReview(
    item.easeFactor,
    item.interval,
    item.repetitions,
    quality
  );

  await prisma.vocabularyItem.update({
    where: { id: itemId },
    data: {
      easeFactor,
      interval,
      repetitions,
      nextReviewAt,
      learned: quality >= 4,
    },
  });

  return { success: true, persisted: true };
}

export async function savePracticeResult(
  bookId: string,
  mode: string,
  totalItems: number,
  correctItems: number,
  durationSec: number
) {
  const user = await requireUser();

  await prisma.practiceResult.create({
    data: {
      userId: user.id,
      bookId,
      mode,
      totalItems,
      correctItems,
      durationSec,
    },
  });

  revalidatePath("/my/practice");
  return { success: true };
}

export async function getMyPracticeStats() {
  const user = await requireUser();

  const results = await prisma.practiceResult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const byMode = results.reduce(
    (acc, r) => {
      if (!acc[r.mode]) acc[r.mode] = { total: 0, correct: 0, sessions: 0 };
      acc[r.mode].total += r.totalItems;
      acc[r.mode].correct += r.correctItems;
      acc[r.mode].sessions += 1;
      return acc;
    },
    {} as Record<string, { total: number; correct: number; sessions: number }>
  );

  return { recent: results.slice(0, 10), byMode };
}
