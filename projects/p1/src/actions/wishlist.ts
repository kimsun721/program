"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getWishlist() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          language: true,
          category: true,
          instructor: {
            select: {
              realName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addToWishlist(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  if (existing) return { error: "이미 찜한 강의입니다" };

  await prisma.wishlist.create({
    data: {
      userId: session.user.id,
      courseId,
    },
  });

  revalidatePath("/wishlist");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export async function removeFromWishlist(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  await prisma.wishlist.deleteMany({
    where: {
      userId: session.user.id,
      courseId,
    },
  });

  revalidatePath("/wishlist");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export async function isWishlisted(courseId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  return !!wishlist;
}
