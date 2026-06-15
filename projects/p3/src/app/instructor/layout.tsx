import Link from "next/link";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/instructor/dashboard", label: "대시보드" },
  { href: "/instructor/courses", label: "내 강의" },
  { href: "/instructor/qna", label: "Q&A" },
];

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("INSTRUCTOR");
  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded-lg border bg-white p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-700">
          강사 영역
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="rounded-lg border bg-white p-6">{children}</main>
    </div>
  );
}
