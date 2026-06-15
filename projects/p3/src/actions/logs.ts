"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function getSystemLogs(
  page = 1,
  level?: string,
  category?: string,
  search?: string
) {
  await requireRole("ADMIN");

  const take = 50;
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  if (category) where.category = category;
  if (search) where.message = { contains: search, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / take) };
}

export async function getLogStats() {
  await requireRole("ADMIN");

  const [byLevel, byCategory] = await Promise.all([
    prisma.systemLog.groupBy({
      by: ["level"],
      _count: { id: true },
    }),
    prisma.systemLog.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
  ]);

  return { byLevel, byCategory };
}
