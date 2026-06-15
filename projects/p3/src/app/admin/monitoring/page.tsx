import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatNumber } from "@/lib/utils";
import {
  Users, BookOpen, ShoppingBag, Star, TrendingUp,
  CreditCard, Activity, Award, Clock
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "모니터링 | Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 60;

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function MonitoringPage() {
  await requireRole("ADMIN");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const [
    totalUsers, totalCourses, totalEnrollments, totalPayments,
    todayUsers, todayEnrollments, todayRevenue,
    weekUsers, weekEnrollments, weekRevenue,
    pendingInstructors, pendingCourses,
    topCourses, recentPayments,
    activeEnrollments, completedEnrollments,
    avgRating, totalReviews,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.user.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    prisma.enrollment.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", paidAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
    prisma.enrollment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", paidAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.instructorProfile.count({ where: { status: "PENDING" } }),
    prisma.course.count({ where: { status: "REVIEW" } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { enrollmentCount: "desc" },
      take: 5,
      select: { id: true, title: true, enrollmentCount: true, avgRating: true, price: true },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
      take: 5,
      select: {
        id: true, amount: true, paidAt: true, method: true,
        user: { select: { nickname: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { status: "COMPLETED" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.count(),
    prisma.systemLog.findMany({
      where: { level: { in: ["WARN", "ERROR"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, level: true, category: true, message: true, createdAt: true },
    }),
  ]);

  const maxEnrollment = topCourses[0]?.enrollmentCount ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">모니터링 대시보드</h1>
          <p className="text-xs text-gray-400 mt-0.5">실시간 운영 현황 · 60초 자동 갱신</p>
        </div>
      </div>

      {/* 긴급 알림 */}
      {(pendingInstructors > 0 || pendingCourses > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap gap-4">
          <Activity className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-4 text-sm text-amber-700">
            {pendingInstructors > 0 && (
              <a href="/admin/instructor-applications" className="hover:underline font-medium">
                강사 승인 대기 {pendingInstructors}건 →
              </a>
            )}
            {pendingCourses > 0 && (
              <a href="/admin/course-approvals" className="hover:underline font-medium">
                강의 승인 대기 {pendingCourses}건 →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 핵심 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "전체 회원", value: formatNumber(totalUsers), icon: Users, color: "text-blue-600", bg: "bg-blue-50", sub: `오늘 +${todayUsers}` },
          { label: "공개 강의", value: formatNumber(totalCourses), icon: BookOpen, color: "text-green-600", bg: "bg-green-50", sub: `수강 ${formatNumber(totalEnrollments)}명` },
          { label: "총 매출", value: formatPrice(totalPayments._sum.amount ?? 0), icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50", sub: `오늘 ${formatPrice(todayRevenue._sum.amount ?? 0)}` },
          { label: "평균 평점", value: `${(avgRating._avg.rating ?? 0).toFixed(1)}점`, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", sub: `리뷰 ${formatNumber(totalReviews)}개` },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-xl p-4 ${kpi.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* 기간별 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 신규 유입 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            신규 회원 추이
          </h3>
          <div className="space-y-3">
            {[
              { label: "오늘", value: todayUsers, color: "bg-blue-500" },
              { label: "이번 주", value: weekUsers, color: "bg-blue-400" },
              { label: "이번 달 (30일)", value: totalUsers, color: "bg-blue-300" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">{formatNumber(item.value)}명</span>
                </div>
                <MiniBar value={item.value} max={totalUsers} color={item.color} />
              </div>
            ))}
          </div>
        </div>

        {/* 수강 현황 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-green-500" />
            수강 현황
          </h3>
          <div className="space-y-3">
            {[
              { label: "오늘 신규 수강", value: todayEnrollments, total: totalEnrollments, color: "bg-green-500" },
              { label: "7일 신규 수강", value: weekEnrollments, total: totalEnrollments, color: "bg-green-400" },
              { label: "완료 수강", value: completedEnrollments, total: totalEnrollments + completedEnrollments, color: "bg-emerald-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">{formatNumber(item.value)}</span>
                </div>
                <MiniBar value={item.value} max={item.total || 1} color={item.color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 매출 현황 + 인기 강의 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 매출 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-500" />
            매출 요약
          </h3>
          <div className="space-y-3">
            {[
              { label: "오늘", value: todayRevenue._sum.amount ?? 0 },
              { label: "이번 주 (7일)", value: weekRevenue._sum.amount ?? 0 },
              { label: "누적 전체", value: totalPayments._sum.amount ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="font-bold text-gray-900">{formatPrice(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">최근 결제</p>
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-700 font-medium">{p.user.nickname}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-500 truncate max-w-24 inline-block align-bottom">
                      {p.course.title}
                    </span>
                  </div>
                  <span className="font-bold text-purple-700">{formatPrice(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 인기 강의 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-orange-500" />
            인기 강의 TOP 5
          </h3>
          <div className="space-y-3">
            {topCourses.map((c, i) => (
              <div key={c.id}>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs font-bold w-5 text-center ${
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-500" : i === 2 ? "text-orange-600" : "text-gray-400"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">
                      수강 {formatNumber(c.enrollmentCount)}명 · ⭐ {c.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="pl-8">
                  <MiniBar
                    value={c.enrollmentCount}
                    max={maxEnrollment}
                    color={i === 0 ? "bg-yellow-400" : "bg-gray-300"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 경고/오류 */}
      {recentLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            최근 경고/오류 로그
          </h3>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                  log.level === "ERROR" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {log.level}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {log.category}
                </span>
                <span className="text-gray-700 flex-1 truncate">{log.message}</span>
              </div>
            ))}
          </div>
          <a href="/admin/logs" className="text-xs text-blue-600 hover:underline mt-3 block">
            전체 로그 보기 →
          </a>
        </div>
      )}
    </div>
  );
}
