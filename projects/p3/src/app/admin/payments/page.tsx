import { requireRole } from "@/lib/rbac";
import { getAdminPayments } from "@/actions/payments";
import { formatPrice, formatDate } from "@/lib/utils";
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "결제 관리 | Admin" };

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "대기", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  COMPLETED: { label: "완료", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  FAILED: { label: "실패", icon: XCircle, color: "text-red-600 bg-red-50" },
  REFUNDED: { label: "환불", icon: RefreshCw, color: "text-gray-600 bg-gray-100" },
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const status = params.status;

  const { payments, total, pages } = await getAdminPayments(page, status);

  const completedRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
        <span className="text-sm text-gray-400">({total.toLocaleString()}건)</span>
      </div>

      {/* 현재 페이지 통계 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">페이지 내 완료 매출</p>
          <p className="text-2xl font-bold text-green-700">{formatPrice(completedRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">현재 페이지 건수</p>
          <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
        </div>
      </div>

      {/* 필터 */}
      <form className="flex gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="PENDING">대기</option>
          <option value="COMPLETED">완료</option>
          <option value="FAILED">실패</option>
          <option value="REFUNDED">환불</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          필터
        </button>
      </form>

      {/* 결제 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">결제자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">강의</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">금액</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">수단</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">일시</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const cfg = statusConfig[p.status] ?? statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{p.user.nickname}</p>
                        <p className="text-xs text-gray-400">{p.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <p className="truncate">{p.course.title}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.method}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="py-12 text-center text-gray-400">결제 내역이 없습니다.</div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}&status=${status ?? ""}`}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" /> 이전
            </a>
          )}
          <span className="text-sm text-gray-500">{page} / {pages}</span>
          {page < pages && (
            <a
              href={`?page=${page + 1}&status=${status ?? ""}`}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              다음 <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
