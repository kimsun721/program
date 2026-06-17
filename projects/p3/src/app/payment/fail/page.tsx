import { XCircle, RotateCcw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "결제 실패" };

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; code?: string; orderId?: string }>;
}) {
  const { message, code, orderId } = await searchParams;

  // orderId 로 강의를 복구해 "다시 시도" 를 해당 결제로 연결
  let retryHref = "/courses";
  if (orderId) {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      select: { courseId: true },
    });
    if (payment) retryHref = `/payment?courseId=${payment.courseId}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
        <p className="text-gray-500 text-sm mb-2">
          {message ?? "결제 처리 중 오류가 발생했습니다."}
        </p>
        {code && (
          <p className="text-xs text-gray-400 mb-6">오류 코드: {code}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href={retryHref}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
          >
            <ShoppingBag className="h-4 w-4" />
            강의 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
