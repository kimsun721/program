import { completePaymentToss } from "@/actions/payments";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "결제 완료" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId || !amount) redirect("/courses");

  const result = await completePaymentToss(
    paymentKey,
    orderId,
    Number(amount)
  );

  if ("error" in result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">결제 처리 실패</h1>
          <p className="text-gray-500 text-sm mb-6">{result.error}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
          >
            강의 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
        <p className="text-gray-500 text-sm mb-8">
          결제가 성공적으로 처리되었습니다. 지금 바로 학습을 시작해보세요!
        </p>
        <div className="flex gap-3">
          <Link
            href={`/my/${result.courseId}/learn`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <BookOpen className="h-4 w-4" />
            학습 시작
          </Link>
          <Link
            href="/my/payments"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
          >
            결제 내역
          </Link>
        </div>
      </div>
    </div>
  );
}
