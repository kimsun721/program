import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 7일간 진도가 없는 활성 수강생 (createdAt 기준)
  const stalledEnrollments = await prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      progressPct: { gt: 0, lt: 100 },
      createdAt: { lte: sevenDaysAgo },
    },
    include: {
      user: { select: { email: true, nickname: true } },
      course: { select: { title: true, id: true } },
    },
    take: 200,
  });

  let sent = 0;
  for (const enrollment of stalledEnrollments) {
    try {
      await sendReminderEmail(
        enrollment.user.email,
        enrollment.user.nickname,
        enrollment.course.title,
        Math.round(enrollment.progressPct)
      );
      sent++;
    } catch {
      // 개별 이메일 실패가 전체를 막으면 안 됨
    }
  }

  await Promise.all(
    stalledEnrollments.slice(0, 50).map((e) =>
      prisma.notification.create({
        data: {
          userId: e.userId,
          type: "COURSE_COMPLETE",
          title: "학습을 이어가 보세요! 📚",
          body: `'${e.course.title}' 강의가 ${Math.round(e.progressPct)}% 완료되었어요. 계속 학습해보세요!`,
          link: `/my/${e.courseId}/learn`,
        },
      })
    )
  );

  await prisma.systemLog.create({
    data: {
      level: "INFO",
      category: "CRON",
      message: `주간 학습 리마인더 발송 완료: ${sent}건`,
      meta: { totalTargets: stalledEnrollments.length, emailSent: sent },
    },
  });

  return NextResponse.json({ success: true, emailSent: sent, total: stalledEnrollments.length });
}
