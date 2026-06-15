import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { initiatePayment } from "@/actions/payments";
import TossPaymentWidget from "./TossPaymentWidget";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "결제하기" };

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  if (!courseId) redirect("/courses");

  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true, title: true, price: true, thumbnail: true },
  });
  if (!course) redirect("/courses");

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (existing) redirect(`/my/${courseId}/learn`);

  const result = await initiatePayment(courseId);

  if ("error" in result) redirect(`/courses/${courseId}`);

  if ("free" in result && result.free) redirect(`/my/${courseId}/learn`);

  if (!("orderId" in result) || !result.orderId) redirect(`/courses/${courseId}`);

  const { orderId, orderName, amount, customerEmail, customerName } = result as {
    orderId: string;
    orderName: string;
    amount: number;
    customerEmail: string;
    customerName: string;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 강의 정보 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <p className="text-blue-100 text-sm mb-1">결제할 강의</p>
            <h1 className="text-xl font-bold">{course.title}</h1>
            <p className="text-3xl font-black mt-2">
              {course.price.toLocaleString("ko-KR")}원
            </p>
          </div>

          <div className="p-6">
            <TossPaymentWidget
              clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""}
              orderId={orderId}
              orderName={orderName}
              amount={amount}
              customerEmail={customerEmail}
              customerName={customerName}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 토스페이먼츠 테스트 결제 — 실제 금액이 청구되지 않습니다
        </p>
      </div>
    </div>
  );
}
