"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function issueCertificate(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) return { error: "수강 정보가 없습니다" };
  if (enrollment.progressPct < 100) {
    return { error: "강의 진도 100%를 채워야 수료증을 받을 수 있습니다" };
  }

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) {
    return { success: "이미 발급된 수료증입니다", certId: existing.id };
  }

  const serialNo = `LC-${new Date().getFullYear()}-${uuidv4()
    .slice(0, 8)
    .toUpperCase()}`;

  const cert = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      courseId,
      serialNo,
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/my/certificates");
  return { success: "수료증이 발급되었습니다", certId: cert.id };
}
