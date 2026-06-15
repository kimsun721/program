"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function createBook(formData: FormData) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };

  const title = ((formData.get("title") as string) ?? "").trim();
  const rawCourse = (formData.get("courseId") as string) ?? "";
  const courseId = rawCourse && rawCourse.length > 0 ? rawCourse : null;
  if (title.length < 1) return { error: "단어장 제목을 입력해주세요" };

  const book = await prisma.vocabularyBook.create({
    data: { userId: user.id, title, courseId },
  });
  revalidatePath("/my/vocab");
  return { success: "단어장을 만들었습니다", bookId: book.id };
}

export async function deleteBook(id: string) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };
  const book = await prisma.vocabularyBook.findUnique({ where: { id } });
  if (!book || book.userId !== user.id) return { error: "권한이 없습니다" };
  await prisma.vocabularyBook.delete({ where: { id } });
  revalidatePath("/my/vocab");
  return { success: "삭제 완료" };
}

export async function addItem(bookId: string, formData: FormData) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };

  const book = await prisma.vocabularyBook.findUnique({ where: { id: bookId } });
  if (!book || book.userId !== user.id) return { error: "권한이 없습니다" };

  const term = ((formData.get("term") as string) ?? "").trim();
  const meaning = ((formData.get("meaning") as string) ?? "").trim();
  const example = ((formData.get("example") as string) ?? "").trim();

  if (!term || !meaning) return { error: "단어와 뜻을 입력해주세요" };

  await prisma.vocabularyItem.create({
    data: { bookId, term, meaning, example: example || null },
  });
  revalidatePath(`/my/vocab/${bookId}`);
  return { success: "추가 완료" };
}

export async function updateItem(id: string, formData: FormData) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };

  const item = await prisma.vocabularyItem.findUnique({
    where: { id },
    include: { book: true },
  });
  if (!item || item.book.userId !== user.id) return { error: "권한이 없습니다" };

  const term = ((formData.get("term") as string) ?? "").trim();
  const meaning = ((formData.get("meaning") as string) ?? "").trim();
  const example = ((formData.get("example") as string) ?? "").trim();
  if (!term || !meaning) return { error: "단어와 뜻을 입력해주세요" };

  await prisma.vocabularyItem.update({
    where: { id },
    data: { term, meaning, example: example || null },
  });
  revalidatePath(`/my/vocab/${item.bookId}`);
  return { success: "수정 완료" };
}

export async function toggleLearned(id: string) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };

  const item = await prisma.vocabularyItem.findUnique({
    where: { id },
    include: { book: true },
  });
  if (!item || item.book.userId !== user.id) return { error: "권한이 없습니다" };

  await prisma.vocabularyItem.update({
    where: { id },
    data: { learned: !item.learned },
  });
  revalidatePath(`/my/vocab/${item.bookId}`);
  return { success: "변경 완료" };
}

export async function deleteItem(id: string) {
  const user = await requireSession();
  if (!user) return { error: "로그인이 필요합니다" };
  const item = await prisma.vocabularyItem.findUnique({
    where: { id },
    include: { book: true },
  });
  if (!item || item.book.userId !== user.id) return { error: "권한이 없습니다" };

  await prisma.vocabularyItem.delete({ where: { id } });
  revalidatePath(`/my/vocab/${item.bookId}`);
  return { success: "삭제 완료" };
}
