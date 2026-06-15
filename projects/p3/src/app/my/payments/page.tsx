import { requireUser } from "@/lib/rbac";
import { getMyPayments } from "@/actions/payments";
import { requestRefund } from "@/actions/payments";
import { formatPrice, formatDate } from "@/lib/utils";
import { CreditCard, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "결제 내역" };

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "결제 대기", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  COMPLETED: { label: "결제 완료", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  FAILED: { label: "결제 실패", icon: XCircle, color: "text-red-600 bg-red-50" },
  REFUNDED: { label: "환불 완료", icon: RefreshCw, color: "text-gray-600 bg-gray-100" },
};

const methodLabel: Record<string, string> = {
  CARD: "카드",
  VBANK: "가상계좌",
  KAKAO: "카카오페이",
  TOSS: "토스페이",
};

async function RefundButton({ paymentId }: { paymentId: string }) {
  async function handleRefund() {
    "use server";
    await requestRefund(paymentId);
  }
  return (
    <form action={handleRefund}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 underline"
      >
        환불 요청
      </button>
    </form>
  );
}

export default async function PaymentsPage() {
  await requireUser();
  const payments = await getMyPayments();

  const totalSpent = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">결제 내역</h1>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
          <p className="text-xs text-blue-600 mt-1">전체 결제</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">
            {payments.filter((p) => p.status === "COMPLETED").length}
          </p>
          <p className="text-xs text-green-600 mt-1">완료</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-purple-700">{formatPrice(totalSpent)}</p>
          <p className="text-xs text-purple-600 mt-1">총 결제 금액</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">결제 내역이 없습니다.</p>
          <Link href="/courses" className="text-blue-600 text-sm mt-2 inline-block">
            강의 둘러보기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const { label, icon: Icon, color } = statusConfig[p.status] ?? statusConfig.PENDING;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start shadow-sm"
              >
                <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-gray-100">
                  {p.course.thumbnail ? (
                    <Image
                      src={p.course.thumbnail}
                      alt={p.course.title}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xl">
                      📚
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/courses/${p.course.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {p.course.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${color}`}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {methodLabel[p.method] ?? p.method}
                    </span>
                    {p.pgTxId && (
                      <span className="text-xs text-gray-400 font-mono">
                        {p.pgTxId.slice(0, 12)}...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-gray-800">{formatPrice(p.amount)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                      </span>
                      {p.status === "COMPLETED" && (
                        <RefundButton paymentId={p.id} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
