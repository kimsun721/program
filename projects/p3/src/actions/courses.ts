"use server";

import { prisma } from "@/lib/prisma";
import type { CourseFilters } from "@/types";

export async function getCourses(filters: CourseFilters = {}) {
  const {
    languageId,
    categoryId,
    level,
    search,
    sort = "newest",
    page = 1,
    limit = 12,
  } = filters;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (languageId) where.languageId = languageId;
  if (categoryId) where.categoryId = categoryId;
  if (level) where.level = level;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: Record<string, unknown> = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "rating") orderBy = { avgRating: "desc" };
  else if (sort === "popular") orderBy = { enrollmentCount: "desc" };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        language: true,
        category: true,
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      language: true,
      category: true,
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
      },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lectures: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              isFreePreview: true,
              sortOrder: true,
              hlsUrl: true,
            },
          },
        },
      },
    },
  });

  return course;
}

export async function getLanguages() {
  return prisma.language.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
