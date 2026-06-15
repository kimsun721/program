"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getVocabBookForPractice(bookId: string) {
  const user = await requireUser();

  const book = await prisma.vocabularyBook.findUnique({
    where: { id: bookId, userId: user.id },
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

  const book = await prisma.vocabularyBook.findUnique({
    where: { id: bookId, userId: user.id },
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

  const item = await prisma.vocabularyItem.findFirst({
    where: {
      id: itemId,
      book: { userId: user.id },
    },
  });
  if (!item) return { error: "단어를 찾을 수 없습니다." };

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

  return { success: true };
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
