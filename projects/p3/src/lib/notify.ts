"use server";

import { prisma } from "@/lib/prisma";

type NotificationType =
  | "QNA_ANSWERED"
  | "COURSE_APPROVED"
  | "COURSE_REJECTED"
  | "INSTRUCTOR_APPROVED"
  | "INSTRUCTOR_REJECTED"
  | "PAYMENT_DONE"
  | "COURSE_COMPLETE";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  } catch {
    console.error("[notify] failed to create notification");
  }
}

export async function notifyQnaAnswered(
  questionUserId: string,
  questionTitle: string,
  courseId: string
) {
  await createNotification(
    questionUserId,
    "QNA_ANSWERED",
    "Q&A 답변이 달렸어요",
    `'${questionTitle}' 질문에 답변이 등록되었습니다.`,
    `/courses/${courseId}`
  );
}

export async function notifyCourseApproved(userId: string, courseTitle: string, courseId: string) {
  await createNotification(
    userId,
    "COURSE_APPROVED",
    "강의가 승인되었어요 🎉",
    `'${courseTitle}' 강의가 게시 승인되었습니다.`,
    `/instructor/courses/${courseId}`
  );
}

export async function notifyCourseRejected(
  userId: string,
  courseTitle: string,
  reason: string,
  courseId: string
) {
  await createNotification(
    userId,
    "COURSE_REJECTED",
    "강의 승인이 반려되었습니다",
    `'${courseTitle}' 강의가 반려되었습니다. 사유: ${reason}`,
    `/instructor/courses/${courseId}`
  );
}

export async function notifyInstructorApproved(userId: string) {
  await createNotification(
    userId,
    "INSTRUCTOR_APPROVED",
    "강사 승인 완료 🎉",
    "강사 신청이 승인되었습니다. 이제 강의를 등록할 수 있습니다.",
    "/instructor/courses/new"
  );
}

export async function notifyInstructorRejected(userId: string, reason: string) {
  await createNotification(
    userId,
    "INSTRUCTOR_REJECTED",
    "강사 신청이 반려되었습니다",
    `강사 신청이 반려되었습니다. 사유: ${reason}`,
    "/become-instructor"
  );
}

export async function notifyPaymentDone(userId: string, courseTitle: string, courseId: string) {
  await createNotification(
    userId,
    "PAYMENT_DONE",
    "결제가 완료되었어요 ✅",
    `'${courseTitle}' 강의 결제가 완료되어 수강이 시작되었습니다.`,
    `/my/${courseId}/learn`
  );
}

export async function notifyCourseComplete(userId: string, courseTitle: string, courseId: string) {
  await createNotification(
    userId,
    "COURSE_COMPLETE",
    "강의 수료 완료 🏆",
    `'${courseTitle}' 강의를 완료했습니다! 수료증을 확인하세요.`,
    `/my/certificates`
  );
}
