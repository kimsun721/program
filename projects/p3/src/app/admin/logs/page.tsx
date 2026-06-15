import { requireRole } from "@/lib/rbac";
import { getSystemLogs, getLogStats } from "@/actions/logs";
import { formatDate } from "@/lib/utils";
import { Activity, AlertTriangle, Info, Bug, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "시스템 로그 | Admin" };

const levelConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  INFO: { label: "INFO", icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
  WARN: { label: "WARN", icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100" },
  ERROR: { label: "ERROR", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  DEBUG: { label: "DEBUG", icon: Bug, color: "text-gray-600", bg: "bg-gray-100" },
};

const categoryColors: Record<string, string> = {
  AUTH: "bg-purple-100 text-purple-700",
  PAYMENT: "bg-teal-100 text-teal-700",
  ENROLLMENT: "bg-blue-100 text-blue-700",
  ADMIN: "bg-red-100 text-red-700",
  CRON: "bg-orange-100 text-orange-700",
  SYSTEM: "bg-gray-100 text-gray-700",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; level?: string; category?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const level = params.level;
  const category = params.category;
  const q = params.q;

  const [{ logs, total, pages }, stats] = await Promise.all([
    getSystemLogs(page, level, category, q),
    getLogStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">시스템 로그</h1>
        <span className="text-sm text-gray-400">({total.toLocaleString()}건)</span>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.byLevel.map((s) => {
          const cfg = levelConfig[s.level] ?? levelConfig.INFO;
          const Icon = cfg.icon;
          return (
            <div key={s.level} className={`rounded-xl p-4 ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
                <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className={`text-2xl font-bold ${cfg.color}`}>{s._count.id.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* 카테고리 통계 */}
      <div className="flex flex-wrap gap-2">
        {stats.byCategory.map((s) => (
          <span
            key={s.category}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              categoryColors[s.category] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {s.category}: {s._count.id}
          </span>
        ))}
      </div>

      {/* 필터 */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="메시지 검색..."
          className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="level"
          defaultValue={level ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 레벨</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          <option value="AUTH">AUTH</option>
          <option value="PAYMENT">PAYMENT</option>
          <option value="ENROLLMENT">ENROLLMENT</option>
          <option value="ADMIN">ADMIN</option>
          <option value="CRON">CRON</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          검색
        </button>
      </form>

      {/* 로그 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">레벨</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">카테고리</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">메시지</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">시간</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const cfg = levelConfig[log.level] ?? levelConfig.INFO;
                const Icon = cfg.icon;
                return (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          categoryColors[log.category] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-sm">
                      <p className="truncate">{log.message}</p>
                      {log.meta && (
                        <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                          {JSON.stringify(log.meta).slice(0, 60)}...
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p>로그가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}&level=${level ?? ""}&category=${category ?? ""}&q=${q ?? ""}`}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" /> 이전
            </a>
          )}
          <span className="text-sm text-gray-500">
            {page} / {pages}
          </span>
          {page < pages && (
            <a
              href={`?page=${page + 1}&level=${level ?? ""}&category=${category ?? ""}&q=${q ?? ""}`}
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
