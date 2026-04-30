import Link from "next/link";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/instructor-applications", label: "강사 신청" },
  { href: "/admin/course-approvals", label: "강의 승인" },
  { href: "/admin/taxonomy", label: "카테고리·언어" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded-lg border bg-white p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          관리자
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
