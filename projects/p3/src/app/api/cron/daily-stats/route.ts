import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);

  const [newUsers, newEnrollments, revenue, completed] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.enrollment.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", paidAt: { gte: yesterday, lt: today } },
      _sum: { amount: true },
    }),
    prisma.enrollment.count({
      where: { status: "COMPLETED", createdAt: { gte: yesterday, lt: today } },
    }),
  ]);

  // 활성 유저 (어제 로그인한 유저) - EmailVerification 접근 빈도로 추정
  const activeUsers = await prisma.user.count({
    where: { updatedAt: { gte: yesterday, lt: today }, status: "ACTIVE" },
  });

  await prisma.dailyStat.upsert({
    where: { date: yesterday },
    create: {
      date: yesterday,
      newUsers,
      newEnrollments,
      revenue: revenue._sum.amount ?? 0,
      activeUsers,
      completedCourses: completed,
    },
    update: {
      newUsers,
      newEnrollments,
      revenue: revenue._sum.amount ?? 0,
      activeUsers,
      completedCourses: completed,
    },
  });

  await prisma.systemLog.create({
    data: {
      level: "INFO",
      category: "CRON",
      message: `일별 통계 집계 완료 (${yesterday.toISOString().split("T")[0]})`,
      meta: { newUsers, newEnrollments, revenue: revenue._sum.amount ?? 0 },
    },
  });

  return NextResponse.json({ success: true, date: yesterday.toISOString().split("T")[0] });
}
