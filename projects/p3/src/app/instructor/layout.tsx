import Link from "next/link";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const NAV = [
  {
    section: "강의 운영",
    items: [
      { href: "/instructor/dashboard", label: "📊 대시보드" },
      { href: "/instructor/courses", label: "📚 내 강의" },
      { href: "/instructor/qna", label: "💬 Q&A 관리" },
    ],
  },
  {
    section: "학습 자료",
    items: [
      { href: "/instructor/vocab", label: "📖 단어장 관리" },
      { href: "/instructor/prompts", label: "🎤 스피킹 프롬프트" },
    ],
  },
];

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("INSTRUCTOR");

  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-gray-200 bg-white p-4 h-fit md:sticky md:top-20">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700 px-2">
          강사 영역
        </div>
        <nav className="flex flex-col gap-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1">
                {group.section}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="rounded-xl border border-gray-200 bg-white p-6 min-h-[400px]">
        {children}
      </main>
    </div>
  );
}
