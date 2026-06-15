import Link from "next/link";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin/dashboard", label: "📊 대시보드", section: "운영" },
  { href: "/admin/monitoring", label: "📈 모니터링", section: "운영" },
  { href: "/admin/payments", label: "💳 결제 관리", section: "운영" },
  { href: "/admin/logs", label: "🗂 시스템 로그", section: "운영" },
  { href: "/admin/users", label: "👤 회원 관리", section: "관리" },
  { href: "/admin/instructor-applications", label: "🎓 강사 신청", section: "관리" },
  { href: "/admin/course-approvals", label: "✅ 강의 승인", section: "관리" },
  { href: "/admin/taxonomy", label: "🏷 카테고리·언어", section: "관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");

  const sections = [...new Set(NAV.map((n) => n.section))];

  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-gray-200 bg-white p-4 h-fit sticky top-20">
        <div className="mb-4 px-2">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">⚡ 관리자</p>
        </div>
        <nav className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
                {section}
              </p>
              {NAV.filter((n) => n.section === section).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="rounded-xl border border-gray-200 bg-white p-6">{children}</main>
    </div>
  );
}
