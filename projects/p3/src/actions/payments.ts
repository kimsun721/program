"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { notifyPaymentDone } from "@/lib/notify";
import { confirmTossPayment } from "@/lib/toss";
import { revalidatePath } from "next/cache";

/** 무료 강의 직접 수강 또는 유료 강의 결제 레코드 생성 */
export async function initiatePayment(courseId: string) {
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true, title: true, price: true },
  });
  if (!course) return { error: "강의를 찾을 수 없습니다." };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  // 환불된 수강은 재등록/재결제 허용
  if (existing && existing.status !== "REFUNDED") {
    return { error: "이미 수강 중인 강의입니다." };
  }

  if (course.price === 0) {
    const enrollment = existing
      ? await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", progressPct: 0 },
        })
      : await prisma.enrollment.create({
          data: { userId: user.id, courseId },
        });
    await prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    });
    await logger.info("ENROLLMENT", `무료 강의 수강신청: ${course.title}`, {
      userId: user.id,
      meta: { courseId },
    });
    revalidatePath("/my");
    revalidatePath(`/courses/${courseId}`);
    return { success: true, free: true, enrollmentId: enrollment.id, courseId };
  }

  // 기존 PENDING 결제 삭제 (페이지 새로고침 대비)
  await prisma.payment.deleteMany({
    where: { userId: user.id, courseId, status: "PENDING" },
  });

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      courseId,
      amount: course.price,
      status: "PENDING",
    },
  });

  // payment.id 를 orderId로 사용
  await prisma.payment.update({
    where: { id: payment.id },
    data: { orderId: payment.id },
  });

  return {
    success: true,
    free: false,
    paymentId: payment.id,
    orderId: payment.id,
    amount: course.price,
    orderName: course.title,
    courseId: course.id,
    customerEmail: user.email ?? "",
    customerName: user.name || user.email || "수강생",
  };
}

/** Toss 서버 승인 후 Enrollment 생성 */
export async function completePaymentToss(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const user = await requireUser();

  // orderId 로 결제 조회 (상태 무관) — 새로고침/중복요청 멱등 처리용
  const payment = await prisma.payment.findFirst({
    where: { orderId, userId: user.id },
    include: { course: { select: { title: true, id: true } } },
  });
  if (!payment) return { error: "결제 정보를 찾을 수 없습니다." };

  // 이미 완료된 결제면 멱등하게 성공 반환 (새로고침/뒤로가기 대비)
  if (payment.status === "COMPLETED") {
    return { success: true, courseId: payment.courseId };
  }
  if (payment.status !== "PENDING") {
    return { error: "처리할 수 없는 결제 상태입니다." };
  }
  if (payment.amount !== amount)
    return { error: "결제 금액이 일치하지 않습니다." };

  // Toss API 서버 승인 — DB 에 저장된 신뢰 가능한 금액으로 승인
  let tossMethod = "TOSS";
  try {
    const confirmed = await confirmTossPayment(paymentKey, orderId, payment.amount);
    // 토스가 반환한 실제 결제수단(예: "카드", "간편결제", "가상계좌")을 저장
    if (confirmed.method) tossMethod = confirmed.method;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "결제 승인 실패";
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await logger.error("PAYMENT", `Toss 승인 실패: ${msg}`, {
      userId: user.id,
      meta: { orderId, paymentKey },
    });
    return { error: msg };
  }

  const [, enrollment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        pgTxId: paymentKey,
        method: tossMethod,
        paidAt: new Date(),
      },
    }),
    // 환불 후 재결제 시 기존 REFUNDED enrollment 가 있으면 재활성화 (unique 충돌 방지)
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: payment.courseId } },
      create: {
        userId: user.id,
        courseId: payment.courseId,
        paymentId: payment.id,
        status: "ACTIVE",
      },
      update: {
        paymentId: payment.id,
        status: "ACTIVE",
        progressPct: 0,
      },
    }),
  ]);

  await Promise.all([
    prisma.course.update({
      where: { id: payment.courseId },
      data: { enrollmentCount: { increment: 1 } },
    }),
    logger.info("PAYMENT", `Toss 결제 완료: ${payment.course.title}`, {
      userId: user.id,
      meta: { paymentId: payment.id, paymentKey, amount },
    }),
    notifyPaymentDone(user.id, payment.course.title, payment.course.id),
  ]);

  revalidatePath("/my");
  revalidatePath("/my/payments");
  return { success: true, enrollmentId: enrollment.id, courseId: payment.courseId };
}

export async function requestRefund(paymentId: string) {
  const user = await requireUser();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId, userId: user.id, status: "COMPLETED" },
    include: { course: { select: { title: true } } },
  });
  if (!payment) return { error: "환불할 수 없는 결제입니다." };

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: payment.courseId, status: "ACTIVE" },
    select: { progressPct: true },
  });
  if (enrollment && enrollment.progressPct > 30) {
    return { error: "진도가 30%를 초과하면 환불이 불가합니다." };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED", refundAt: new Date() },
    }),
    prisma.enrollment.updateMany({
      where: { userId: user.id, courseId: payment.courseId, paymentId },
      data: { status: "REFUNDED" },
    }),
    prisma.course.update({
      where: { id: payment.courseId },
      data: { enrollmentCount: { decrement: 1 } },
    }),
  ]);

  await logger.warn("PAYMENT", `환불 처리: ${payment.course.title}`, {
    userId: user.id,
    meta: { paymentId, amount: payment.amount },
  });

  revalidatePath("/my/payments");
  return { success: true };
}

export async function getMyPayments() {
  const user = await requireUser();
  return prisma.payment.findMany({
    where: { userId: user.id },
    include: { course: { select: { id: true, title: true, thumbnail: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminPayments(page = 1, status?: string) {
  const take = 20;
  const skip = (page - 1) * take;
  const where = status ? { status } : {};
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.payment.count({ where }),
  ]);
  return { payments, total, pages: Math.ceil(total / take) };
}
