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

export async function createCourseVocabBook(formData: FormData) {
  const { user } = await getInstructorProfile();

  const title = ((formData.get("title") as string) ?? "").trim();
  const courseId = (formData.get("courseId") as string) ?? "";
  const isPublic = formData.get("isPublic") === "true";

  if (!title) return { error: "단어장 제목을 입력해주세요." };
  if (title.length > 100) return { error: "제목은 100자 이내로 입력해주세요." };

  if (courseId) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructor: { userId: user.id } },
    });
    if (!course) return { error: "해당 강의에 대한 권한이 없습니다." };
  }

  const book = await prisma.vocabularyBook.create({
    data: {
      userId: user.id,
      courseId: courseId || null,
      title,
      isPublic,
    },
  });

  revalidatePath("/instructor/vocab");
  return { success: true, bookId: book.id };
}

export async function updateCourseVocabBook(bookId: string, formData: FormData) {
  const { user } = await getInstructorProfile();

  const book = await prisma.vocabularyBook.findUnique({ where: { id: bookId } });
  if (!book || book.userId !== user.id) return { error: "권한이 없습니다." };

  const title = ((formData.get("title") as string) ?? "").trim();
  const isPublic = formData.get("isPublic") === "true";

  if (!title) return { error: "단어장 제목을 입력해주세요." };

  await prisma.vocabularyBook.update({
    where: { id: bookId },
    data: { title, isPublic },
  });

  revalidatePath("/instructor/vocab");
  revalidatePath(`/instructor/vocab/${bookId}`);
  return { success: true };
}

export async function deleteCourseVocabBook(bookId: string) {
  const { user } = await getInstructorProfile();

  const book = await prisma.vocabularyBook.findUnique({ where: { id: bookId } });
  if (!book || book.userId !== user.id) return { error: "권한이 없습니다." };

  await prisma.vocabularyBook.delete({ where: { id: bookId } });
  revalidatePath("/instructor/vocab");
  return { success: true };
}

export async function addVocabItem(bookId: string, formData: FormData) {
  const { user } = await getInstructorProfile();

  const book = await prisma.vocabularyBook.findUnique({ where: { id: bookId } });
  if (!book || book.userId !== user.id) return { error: "권한이 없습니다." };

  const term = ((formData.get("term") as string) ?? "").trim();
  const meaning = ((formData.get("meaning") as string) ?? "").trim();
  const example = ((formData.get("example") as string) ?? "").trim();

  if (!term || !meaning) return { error: "단어와 뜻을 입력해주세요." };
  if (term.length > 200) return { error: "단어는 200자 이내로 입력해주세요." };
  if (meaning.length > 500) return { error: "뜻은 500자 이내로 입력해주세요." };

  await prisma.vocabularyItem.create({
    data: { bookId, term, meaning, example: example || null },
  });

  revalidatePath(`/instructor/vocab/${bookId}`);
  return { success: true };
}

export async function updateVocabItem(itemId: string, formData: FormData) {
  const { user } = await getInstructorProfile();

  const item = await prisma.vocabularyItem.findUnique({
    where: { id: itemId },
    include: { book: true },
  });
  if (!item || item.book.userId !== user.id) return { error: "권한이 없습니다." };

  const term = ((formData.get("term") as string) ?? "").trim();
  const meaning = ((formData.get("meaning") as string) ?? "").trim();
  const example = ((formData.get("example") as string) ?? "").trim();

  if (!term || !meaning) return { error: "단어와 뜻을 입력해주세요." };

  await prisma.vocabularyItem.update({
    where: { id: itemId },
    data: { term, meaning, example: example || null },
  });

  revalidatePath(`/instructor/vocab/${item.bookId}`);
  return { success: true };
}

export async function deleteVocabItem(itemId: string) {
  const { user } = await getInstructorProfile();

  const item = await prisma.vocabularyItem.findUnique({
    where: { id: itemId },
    include: { book: true },
  });
  if (!item || item.book.userId !== user.id) return { error: "권한이 없습니다." };

  await prisma.vocabularyItem.delete({ where: { id: itemId } });
  revalidatePath(`/instructor/vocab/${item.bookId}`);
  return { success: true };
}
