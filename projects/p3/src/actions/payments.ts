"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { notifyPaymentDone } from "@/lib/notify";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function initiatePayment(courseId: string, method: string) {
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true, title: true, price: true },
  });
  if (!course) return { error: "강의를 찾을 수 없습니다." };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (existing) return { error: "이미 수강 중인 강의입니다." };

  if (course.price === 0) {
    const enrollment = await prisma.enrollment.create({
      data: { userId: user.id, courseId },
    });
    await logger.info("ENROLLMENT", `무료 강의 수강신청: ${course.title}`, {
      userId: user.id,
      meta: { courseId },
    });
    revalidatePath("/my");
    return { success: true, enrollmentId: enrollment.id, free: true };
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      courseId,
      amount: course.price,
      method: method || "CARD",
      status: "PENDING",
    },
  });

  return { success: true, paymentId: payment.id, amount: course.price, free: false };
}

export async function completePayment(paymentId: string) {
  const user = await requireUser();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId, userId: user.id, status: "PENDING" },
    include: { course: { select: { title: true, id: true } } },
  });
  if (!payment) return { error: "결제 정보를 찾을 수 없습니다." };

  const pgTxId = `mock_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

  const [updatedPayment, enrollment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", pgTxId, paidAt: new Date() },
    }),
    prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: payment.courseId,
        paymentId: payment.id,
        status: "ACTIVE",
      },
    }),
  ]);

  await Promise.all([
    prisma.course.update({
      where: { id: payment.courseId },
      data: { enrollmentCount: { increment: 1 } },
    }),
    logger.info("PAYMENT", `결제 완료: ${payment.course.title}`, {
      userId: user.id,
      meta: { paymentId, pgTxId, amount: payment.amount },
    }),
    notifyPaymentDone(user.id, payment.course.title, payment.course.id),
  ]);

  revalidatePath("/my");
  revalidatePath("/my/payments");
  return { success: true, enrollmentId: enrollment.id };
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
