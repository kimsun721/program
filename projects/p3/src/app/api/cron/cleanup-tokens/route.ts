import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const { count } = await prisma.emailVerification.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { usedAt: { not: null } },
      ],
    },
  });

  await prisma.systemLog.create({
    data: {
      level: "INFO",
      category: "CRON",
      message: `만료 토큰 정리 완료: ${count}건 삭제`,
      meta: { deletedCount: count },
    },
  });

  return NextResponse.json({ success: true, deletedCount: count });
}
